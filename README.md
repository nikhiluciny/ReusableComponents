# Path Assistant Component

A customizable Lightning Web Component (LWC) that provides a visual path interface for Salesforce records with picklist fields. Perfect for tracking record progress through different stages with an intuitive, clickable path interface.



## Features

- 🎯 **Visual Progress Tracking**: Clear visual representation of record status progression
- 🎨 **Fully Customizable**: Easy color theming and styling customization
- ⚡ **Plug & Play**: Drop-in component with sensible defaults
- 🔒 **Safe Defaults**: Built-in fallbacks prevent component failures
- 📱 **Responsive Design**: Works seamlessly across desktop and mobile
- 🚀 **Lightning Design System**: Uses SLDS for consistent Salesforce look and feel

## Quick Start

### 1. Deploy the Component

Deploy the following files to your Salesforce org:
- `pathAssistant.js` (JavaScript controller)
- `pathAssistant.html` (HTML template)
- `pathAssistant.css` (Styling)
- `utils.js` (Utility classes)

### 2. Add to Your Page

#### App Builder (Recommended)
1. Open the Lightning App Builder
2. Drag the "Path Assistant" component to your page
3. Configure the properties in the right panel

#### Programmatically
```html
<c-path-assistant
    object-api-name="Your_Object__c"
    record-id={recordId}
    picklist-field="Status__c"
    closed-ok="Completed"
    last-step-label="Final Step">
</c-path-assistant>
```

## Configuration

### Required Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `recordId` | String | The record ID to display the path for | `{recordId}` |

### Optional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `objectApiName` | String | `Plan__c` | API name of the object |
| `picklistField` | String | `Status__c` | Picklist field API name (supports dot notation) |
| `closedOk` | String | `Workplan Active` | Value representing successful completion |
| `closedKo` | String | - | Value representing unsuccessful completion (optional) |
| `lastStepLabel` | String | `Active Workplan` | Label for the final step |
| `hideUpdateButton` | Boolean | `false` | Hide the update button |

### Advanced Configuration Examples

#### Basic Implementation
```html
<c-path-assistant
    object-api-name="Opportunity"
    record-id={recordId}
    picklist-field="StageName"
    closed-ok="Closed Won"
    closed-ko="Closed Lost">
</c-path-assistant>
```

#### Custom Object with Dot Notation
```html
<c-path-assistant
    object-api-name="Custom_Process__c"
    record-id={recordId}
    picklist-field="Custom_Process__c.Stage__c"
    closed-ok="Approved"
    last-step-label="Process Complete">
</c-path-assistant>
```

#### Case Management
```html
<c-path-assistant
    object-api-name="Case"
    record-id={recordId}
    picklist-field="Status"
    closed-ok="Closed"
    last-step-label="Case Resolved">
</c-path-assistant>
```

## Customization

### Color Theming

The component uses CSS custom properties for easy theming. Update these variables in the CSS file:

```css
:host {
  /* Current/Active step color */
  --path-color-current: #43285D;
  
  /* Completed steps color */
  --path-color-complete: #8B7FA0;
  
  /* Incomplete steps color */
  --path-color-incomplete: #D3D5E3;
  
  /* Text colors */
  --text-color-on-dark: #FFFFFF;
  --text-color-on-light: #181818;
}
```

### Pre-built Color Schemes

#### Professional Blue
```css
:host {
  --path-color-current: #1B5294;
  --path-color-complete: #5A9FD4;
  --path-color-incomplete: #E8F2FF;
}
```

#### Success Green
```css
:host {
  --path-color-current: #2E7D32;
  --path-color-complete: #66BB6A;
  --path-color-incomplete: #E8F5E8;
}
```

#### Warning Orange
```css
:host {
  --path-color-current: #F57C00;
  --path-color-complete: #FFB74D;
  --path-color-incomplete: #FFF3E0;
}
```

## Behavior

### Path Logic
- **Current Step**: Highlighted with the primary color
- **Completed Steps**: Shown in the secondary color with checkmarks
- **Incomplete Steps**: Shown in the neutral color
- **Final Step**: Automatically sets to `closedOk` value when clicked

### Button Actions
- **Mark as Complete**: Advances to the next step
- **Mark as Current**: Sets the selected step as current
- **Final Step**: Immediately sets the record to the `closedOk` status

### Error Handling
- Validates that required picklist values exist
- Provides clear error messages for configuration issues
- Falls back to default Record Type if none specified
- Handles field access permissions gracefully

## Troubleshooting

### Common Issues

#### "Picklist field isn't available"
- Verify the field API name is correct
- Ensure the field exists on the specified Record Type
- Check field-level security permissions

#### "Not enough picklist values"
- The component requires at least 2 picklist values
- Verify Record Type has the necessary picklist values enabled

#### Component not loading
- Confirm all files are deployed correctly
- Check browser console for JavaScript errors
- Verify the record ID is valid

### Debug Mode
Add `console.log` statements in the JavaScript file to debug:

```javascript
// Add to any method for debugging
console.log('Current step:', this.currentStep);
console.log('Available steps:', this.possibleSteps);
console.log('Selected value:', this.selectedStepValue);
```

## Browser Support

- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Lazy Loading**: Component only loads when visible
- **Efficient Rendering**: Minimal DOM updates
- **Wire Service**: Utilizes Salesforce's efficient data loading
- **Memory Optimized**: Proper cleanup and state management

## Security

- **Field-Level Security**: Respects Salesforce FLS settings
- **Record Access**: Honors sharing rules and permissions
- **Input Validation**: Sanitizes all user inputs
- **CSRF Protection**: Uses Salesforce's built-in protection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/path-assistant-lwc.git

# Deploy to scratch org
sfdx force:org:create -f config/project-scratch-def.json -a pathassistant
sfdx force:source:push
sfdx force:org:open
```

## License

MIT License - see [LICENSE](LICENSE) file for details.


## Changelog

### v1.0.0
- Initial release with core path functionality
- CSS custom properties for theming
- Support for dot notation field names
- Comprehensive error handling

