/**
 * Custom path assistant for Plan__c.Status__c with:
 * - Safe defaults (Status__c, Workplan Active)
 * - Field-name normalization (accepts 'Plan__c.Status__c' or 'Status__c')
 * - Default Record Type fallback for App Builder
 * - NO POPUP for final step: clicking final step immediately sets closedOk
 */
import { LightningElement, api, wire } from 'lwc';
import { getObjectInfo, getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import { updateRecord, getRecord } from 'lightning/uiRecordApi';

import {
    ScenarioState,
    ScenarioLayout,
    MarkAsCompleteScenario,
    MarkAsCurrentScenario,
    SelectClosedScenario,
    ChangeClosedScenario,
    Step
} from './utils';

const OPEN_MODAL_TO_SELECT_CLOSED_STEP = 'pathAssistant_selectAClosedStepValue';

export default class PathAssistant extends LightningElement {
    // exposed props (with safe defaults)
    @api objectApiName = 'Plan__c';
    @api recordId;
    @api picklistField = 'Status__c';
    @api closedOk = 'Workplan Active';
    @api closedKo; // optional; ignored for final close (we always set closedOk)
    @api lastStepLabel = 'Active Workplan';
    @api hideUpdateButton = false;

    // state
    spinner = false;
    objectInfo;
    record;
    errorMsg;
    possibleSteps;
    selectedStepValue;
    _recordTypeId;
    _currentScenario;

    // labels (could be custom labels)
    labels = {
        selectClosed: 'Select Closed {0}',
        markAsComplete: 'Mark {0} as Complete',
        markAsCurrent: 'Mark as Current {0}',
        changeClosed: 'Change Active {0}',
        genericErrorMessage: 'An unexpected error occurred. Please contact your System Administrator.'
    };
    _token = '{0}';

    // normalize 'Plan__c.Status__c' -> 'Status__c'
    get fieldApiName() {
        if (!this.picklistField) return undefined;
        const parts = this.picklistField.split('.');
        return parts[parts.length - 1];
    }

    constructor() {
        super();
        // scenarios (kept for button text/behavior; we bypass modal logic)
        this._scenarios = [];
        this._scenarios.push(
            new MarkAsCompleteScenario(
                new ScenarioLayout(this.labels.selectClosed, this.labels.markAsComplete, this._token)
            )
        );
        this._scenarios.push(
            new MarkAsCurrentScenario(
                new ScenarioLayout('', this.labels.markAsCurrent, this._token)
            )
        );
        this._scenarios.push(
            new SelectClosedScenario(
                new ScenarioLayout(this.labels.selectClosed, this.labels.selectClosed, this._token)
            )
        );
        this._scenarios.push(
            new ChangeClosedScenario(
                new ScenarioLayout(this.labels.selectClosed, this.labels.changeClosed, this._token)
            )
        );
    }

    /* ========== WIRES ========== */

    @wire(getRecord, { recordId: '$recordId', layoutTypes: 'Full', modes: 'View' })
    wiredRecord({ error, data }) {
        if (error) {
            this.errorMsg = error.body?.message;
        }
        if (data) {
            this.record = data;
            this._recordTypeId = data.recordTypeId;
        }
    }

    @wire(getObjectInfo, { objectApiName: '$objectApiName' })
    wiredObject({ error, data }) {
        if (error) {
            this.errorMsg = error.body?.message;
        }
        if (data) {
            this.objectInfo = data;
            if (!this._recordTypeId) {
                this._recordTypeId = data.defaultRecordTypeId;
            }
        }
    }

    @wire(getPicklistValuesByRecordType, {
        objectApiName: '$objectApiName',
        recordTypeId: '$_recordTypeId'
    })
    wiredPicklistValues({ error, data }) {
        if (!this._recordTypeId || !this.fieldApiName) return;

        if (error) {
            this.errorMsg = error.body?.message;
            return;
        }

        if (data) {
            const fieldValues = data.picklistFieldValues || {};
            const field = fieldValues[this.fieldApiName];

            if (!field) {
                this.errorMsg = `Picklist "${this.fieldApiName}" isn’t available for record type ${this._recordTypeId}.`;
                return;
            }

            this.possibleSteps = field.values.map((elem, idx) => new Step(elem.value, elem.label, idx));
            this._validateSteps();
        }
    }

    /* ========== PRIVATE METHODS ========== */

    _setCurrentScenario() {
        const state = new ScenarioState(
            this.isClosed,
            this.selectedStepValue,
            this.currentStep.value,
            OPEN_MODAL_TO_SELECT_CLOSED_STEP
        );

        for (let idx in this._scenarios) {
            if (this._scenarios[idx].appliesToState(state)) {
                this._currentScenario = this._scenarios[idx];
                break;
            }
        }
    }

    // KO optional; must include OK and have enough steps
    _validateSteps() {
        let isClosedOkAvailable = false;
        (this.possibleSteps || []).forEach((step) => {
            isClosedOkAvailable ||= step.equals(this.closedOk);
        });

        if (!isClosedOkAvailable) {
            this.errorMsg = `${this.closedOk} value is not available for record type ${this._recordTypeId}`;
            return;
        }

        if ((this.possibleSteps || []).length < 2) {
            this.errorMsg = `Not enough picklist values are available for record type ${this._recordTypeId}.`;
        }
    }

    _getStepElementCssClass(step) {
        let classText = 'slds-path__item';

        if (step.equals(this.closedOk)) classText += ' slds-is-won';
        if (this.closedKo && step.equals(this.closedKo)) classText += ' slds-is-lost';

        if (step.equals(this.selectedStepValue)) classText += ' slds-is-active';

        if (step.equals(this.currentStep)) {
            classText += ' slds-is-current';
            if (!this.selectedStepValue) classText += ' slds-is-active';
        } else if (step.isBefore(this.currentStep) && !this.isClosedKo) {
            classText += ' slds-is-complete';
        } else {
            classText += ' slds-is-incomplete';
        }
        return classText;
    }

    _resetComponentState() {
        this.record = undefined;
        this.selectedStepValue = undefined;
        this._currentScenario = undefined;
    }

    _updateRecord(stepValue) {
        const fields = { Id: this.recordId };
        fields[this.fieldApiName] = stepValue;

        this.spinner = true;
        updateRecord({ fields })
            .then(() => {
                this.spinner = false;
            })
            .catch((error) => {
                this.errorMsg = error.body?.message;
                this.spinner = false;
            });

        this._resetComponentState();
    }

    /* ========== GETTERS ========== */

    get currentStep() {
        for (let idx in (this.possibleSteps || [])) {
            const step = this.possibleSteps[idx];
            if (step.equals(this.record?.fields?.[this.fieldApiName]?.value)) {
                return step;
            }
        }
        return new Step();
    }

    get nextStep() {
        return (this.possibleSteps || [])[this.currentStep.index + 1];
    }

    get steps() {
        let closedOkElem;
        let closedKoElem;

        let res = (this.possibleSteps || [])
            .filter((step) => {
                if (step.equals(this.closedOk)) {
                    closedOkElem = step;
                    return false;
                }
                if (this.closedKo && step.equals(this.closedKo)) {
                    closedKoElem = step;
                    return false;
                }
                return true;
            })
            .map((step) => {
                step.setClassText(this._getStepElementCssClass(step));
                return step;
            });

        let lastStep;
        if (this.isClosedOk) {
            lastStep = closedOkElem;
        } else if (this.isClosedKo) {
            lastStep = closedKoElem;
        } else {
            // final action: immediately set closedOk (no popup)

            const finalLabel = (closedOkElem && closedOkElem.label) || this.closedOk || this.lastStepLabel;
            lastStep = new Step(
                OPEN_MODAL_TO_SELECT_CLOSED_STEP,
                finalLabel,
                Infinity
            );
        }

        lastStep.setClassText(this._getStepElementCssClass(lastStep));
        res.push(lastStep);
        return res;
    }

    get isClosed() {
        return this.isClosedKo || this.isClosedOk;
    }

    get isClosedOk() {
        return this.currentStep.equals(this.closedOk);
    }

    get isClosedKo() {
        return this.closedKo ? this.currentStep.equals(this.closedKo) : false;
    }

    get isLoaded() {
        const res = this.record && this.objectInfo && this.possibleSteps;
        if (res && !this._currentScenario) {
            this._setCurrentScenario();
        }
        return res;
    }

    get isUpdateButtonDisabled() {
        return !this.currentStep.hasValue() && !this.selectedStepValue;
    }

    get hasToShowSpinner() {
        return this.spinner || !this.isLoaded;
    }

    get genericErrorMessage() {
        return this.labels.genericErrorMessage;
    }

    get displayUpdateButton() {
        return !this.hideUpdateButton;
    }

    get updateButtonText() {
        return this._currentScenario
            ? this._currentScenario.layout.getUpdateButtonText(this.picklistFieldLabel)
            : '';
    }

    get modalHeader() {
        // no modal anymore; keep getter for compatibility
        return '';
    }

    get selectLabel() {
        return this.picklistFieldLabel;
    }

    get picklistFieldLabel() {
        return this.objectInfo?.fields?.[this.fieldApiName]?.label || this.fieldApiName;
    }

    /* ========== EVENT HANDLERS ========== */

    handleStepSelected(event) {
        const val = event.currentTarget.getAttribute('data-value');

        // NEW: clicking the final step immediately marks as closedOk (no popup)
        if (val === OPEN_MODAL_TO_SELECT_CLOSED_STEP) {
            this._updateRecord(this.closedOk);
            return;
        }

        this.selectedStepValue = val;
        this._setCurrentScenario();
    }

    handleUpdateButtonClick() {
        // When marking complete and the next step would be a closed state,
        // set closedOk directly (no popup).
        switch (this._currentScenario?.constructor) {
            case MarkAsCompleteScenario:
                if (this.nextStep?.equals?.(this.closedKo) || this.nextStep?.equals?.(this.closedOk)) {
                    this._updateRecord(this.closedOk);
                } else {
                    this._updateRecord(this.nextStep?.value);
                }
                break;

            case MarkAsCurrentScenario:
                if (this.selectedStepValue === OPEN_MODAL_TO_SELECT_CLOSED_STEP) {
                    this._updateRecord(this.closedOk);
                } else {
                    this._updateRecord(this.selectedStepValue);
                }
                break;

            case SelectClosedScenario:
            case ChangeClosedScenario:
                // No modal—always set to closedOk
                this._updateRecord(this.closedOk);
                break;

            default:
                break;
        }
    }
}
