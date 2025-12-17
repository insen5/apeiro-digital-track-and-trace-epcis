# Dynamic Form System

A highly reusable, scalable form system that allows you to create complex forms by simply passing configuration objects.

## Features

- 🚀 **Highly Reusable**: Use the same form component for different screens
- ⚡ **Performance Optimized**: Memoized components and debounced validation
- 🎨 **Customizable**: Extensive styling and layout options
- 🔒 **Type Safe**: Full TypeScript support
- 📱 **Responsive**: Mobile-first design
- ♿ **Accessible**: Built-in accessibility features
- 🔍 **Real-time Validation**: Instant feedback with debounced validation
- 🎯 **Field Types**: Support for text, email, password, select, textarea, checkbox, radio, and more
- 📊 **Sections**: Organize fields into logical sections
- 🎨 **Password Strength**: Built-in password strength indicator
- 🔄 **Loading States**: Built-in loading and error states

## Quick Start

### 1. Basic Usage

```tsx
import DynamicForm from "@/components/forms/DynamicForm";

const MyForm = () => {
  const handleSubmit = async (data: Record<string, any>) => {
    // Handle form submission
    console.log("Form data:", data);
  };

  return (
    <DynamicForm
      config={myFormConfig}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
};
```

### 2. Form Configuration

```tsx
import { FormConfig } from "@/components/forms/DynamicForm";

const myFormConfig: FormConfig = {
  fields: [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      placeholder: "Enter first name",
      validation: {
        required: true,
        minLength: 2,
        message: "First name must be at least 2 characters",
      },
      gridCols: 1,
    },
    // ... more fields
  ],
  sections: [
    {
      title: "Personal Information",
      fields: ["firstName", "lastName"],
    },
  ],
  submitButton: {
    text: "Submit",
    loadingText: "Submitting...",
  },
};
```

## Field Types

### Text Fields
```tsx
{
  name: "firstName",
  label: "First Name",
  type: "text", // or "email", "password", "number", "tel", "url"
  placeholder: "Enter first name",
  validation: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z]+$/,
    message: "First name must be 2-50 characters",
  },
}
```

### Select Fields
```tsx
{
  name: "category",
  label: "Category",
  type: "select",
  options: [
    { value: "option1", label: "Option 1", description: "Description" },
    { value: "option2", label: "Option 2" },
  ],
  validation: {
    required: true,
    message: "Please select a category",
  },
}
```

### Textarea Fields
```tsx
{
  name: "description",
  label: "Description",
  type: "textarea",
  placeholder: "Enter description",
  validation: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: "Description must be 10-500 characters",
  },
}
```

### Checkbox Fields
```tsx
{
  name: "agree",
  label: "I agree to the terms",
  type: "checkbox",
  validation: {
    required: true,
    message: "You must agree to the terms",
  },
}
```

### Radio Fields
```tsx
{
  name: "theme",
  label: "Theme",
  type: "radio",
  options: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ],
  validation: {
    required: true,
    message: "Please select a theme",
  },
}
```

### Password Fields with Strength Indicator
```tsx
{
  name: "password",
  label: "Password",
  type: "password",
  showPasswordToggle: true,
  showPasswordStrength: true,
  validation: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      // Custom validation logic
      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      if (!hasUppercase) return "Password must contain uppercase letter";
      if (!hasLowercase) return "Password must contain lowercase letter";
      if (!hasNumber) return "Password must contain number";
      if (!hasSpecialChar) return "Password must contain special character";
      
      return "";
    },
  },
}
```

## Validation Rules

### Basic Validation
```tsx
validation: {
  required: true,
  minLength: 2,
  maxLength: 50,
  pattern: /^[a-zA-Z]+$/,
  message: "Custom error message",
}
```

### Number Validation
```tsx
validation: {
  required: true,
  min: 0,
  max: 100,
  message: "Value must be between 0 and 100",
}
```

### Custom Validation
```tsx
validation: {
  required: true,
  custom: (value: string, formData: Record<string, any>) => {
    if (value !== formData.password) {
      return "Passwords do not match";
    }
    return "";
  },
  message: "Passwords do not match",
}
```

## Form Sections

```tsx
sections: [
  {
    title: "Personal Information",
    description: "Basic personal details",
    fields: ["firstName", "lastName", "email"],
    order: 1,
  },
  {
    title: "Account Settings",
    description: "Account preferences",
    fields: ["username", "password"],
    order: 2,
  },
]
```

## Layout Options

### Grid Layout
```tsx
{
  name: "firstName",
  gridCols: 1, // 1, 2, 3, 4, 6, or 12
}
```

### UI Configuration
```tsx
ui: {
  showSections: true,
  sectionSpacing: "space-y-8",
  fieldSpacing: "gap-6",
}
```

## Props

### DynamicForm Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `FormConfig` | ✅ | Form configuration object |
| `onSubmit` | `(data: Record<string, any>) => Promise<void>` | ✅ | Submit handler |
| `onCancel` | `() => void` | ❌ | Cancel handler |
| `initialData` | `Record<string, any>` | ❌ | Initial form data |
| `className` | `string` | ❌ | Additional CSS classes |
| `showHeader` | `boolean` | ❌ | Show form header (default: true) |
| `headerTitle` | `string` | ❌ | Header title |
| `headerDescription` | `string` | ❌ | Header description |
| `confirmationModal` | `object` | ❌ | Confirmation modal config |
| `successModal` | `object` | ❌ | Success modal config |

### FormConfig Properties

| Property | Type | Description |
|----------|------|-------------|
| `fields` | `FormField[]` | Array of form fields |
| `sections` | `FormSection[]` | Optional field sections |
| `submitButton` | `object` | Submit button configuration |
| `cancelButton` | `object` | Cancel button configuration |
| `validation` | `object` | Validation configuration |
| `ui` | `object` | UI configuration |

## Examples

### 1. Simple Contact Form
```tsx
const contactFormConfig = {
  fields: [
    {
      name: "name",
      label: "Name",
      type: "text",
      validation: { required: true, message: "Name is required" },
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      validation: { required: true, message: "Email is required" },
    },
    {
      name: "message",
      label: "Message",
      type: "textarea",
      validation: { required: true, message: "Message is required" },
    },
  ],
  submitButton: { text: "Send Message" },
};
```

### 2. User Registration Form
```tsx
const userFormConfig = {
  fields: [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      validation: { required: true, minLength: 2 },
      gridCols: 1,
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      validation: { required: true, minLength: 2 },
      gridCols: 1,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      validation: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      gridCols: 2,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      showPasswordToggle: true,
      showPasswordStrength: true,
      validation: { required: true, minLength: 8 },
      gridCols: 1,
    },
  ],
  sections: [
    {
      title: "Personal Information",
      fields: ["firstName", "lastName", "email"],
    },
    {
      title: "Account Security",
      fields: ["password"],
    },
  ],
};
```

### 3. Settings Form
```tsx
const settingsFormConfig = {
  fields: [
    {
      name: "notifications",
      label: "Email Notifications",
      type: "checkbox",
    },
    {
      name: "theme",
      label: "Theme",
      type: "radio",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
  ],
  submitButton: { text: "Save Settings" },
};
```

## Advanced Usage

### Custom Validation
```tsx
validation: {
  custom: (value: string, formData: Record<string, any>) => {
    // Complex validation logic
    if (value.length < 8) return "Password too short";
    if (!/[A-Z]/.test(value)) return "Password needs uppercase";
    if (!/[a-z]/.test(value)) return "Password needs lowercase";
    if (!/\d/.test(value)) return "Password needs number";
    return "";
  },
}
```

### Conditional Fields
```tsx
// You can implement conditional logic in your submit handler
const handleSubmit = async (data: Record<string, any>) => {
  // Only include fields that have values
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== "" && value !== null)
  );
  
  await submitToAPI(filteredData);
};
```

### Form with Initial Data (Edit Mode)
```tsx
<DynamicForm
  config={userFormConfig}
  onSubmit={handleUpdate}
  initialData={{
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
  }}
  headerTitle="Edit User"
  confirmationModal={{
    title: "Update User",
    message: "Are you sure you want to update this user?",
  }}
/>
```

## Best Practices

1. **Keep configurations in separate files** for reusability
2. **Use meaningful field names** that match your API
3. **Group related fields** into sections for better UX
4. **Provide clear validation messages** for better user experience
5. **Use appropriate field types** for better mobile experience
6. **Test validation rules** thoroughly
7. **Keep forms focused** - one form per logical action

## Performance Tips

1. **Use memoized configurations** to prevent unnecessary re-renders
2. **Implement debounced validation** for complex fields
3. **Lazy load** form configurations when possible
4. **Use appropriate grid layouts** for responsive design

## Troubleshooting

### Common Issues

1. **Field not showing**: Check if field name is in sections
2. **Validation not working**: Ensure validation rules are properly configured
3. **Styling issues**: Check if custom classes are properly applied
4. **Type errors**: Ensure all required props are provided

### Debug Mode

Add console logs to your submit handler to debug form data:

```tsx
const handleSubmit = async (data: Record<string, any>) => {
  console.log("Form data:", data);
  console.log("Form errors:", errors);
  // ... rest of your logic
};
```

## Contributing

When adding new field types or features:

1. Update the `FieldType` union type
2. Add the field rendering logic in `DynamicFormField`
3. Update validation logic if needed
4. Add examples to this documentation
5. Test with different configurations

## License

This component is part of the TnT WebApp project.
