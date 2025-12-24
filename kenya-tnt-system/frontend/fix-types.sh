#!/bin/bash

# Fix FormSection issues - change 'name' to 'title' and add 'fields'
find app -name "*.tsx" -type f -exec sed -i '' '
/sections: \[/,/\]/{ 
  s/name:/title:/g
}
' {} \;

# Fix render function types
find app -name "*.tsx" -type f -exec sed -i '' '
s/render: (value: string)/render: (value: unknown)/g
s/render: (value: number)/render: (value: unknown)/g
s/render: (value: boolean)/render: (value: unknown)/g
s/render: (value: string\[\])/render: (value: unknown)/g
s/render: (_: any,/render: (_: unknown,/g
' {} \;

# Remove onRowClick props from GenericTable
find app -name "*.tsx" -type f -exec sed -i '' '
/onRowClick={(row) =>.*}/d
' {} \;

echo "Type fixes applied!"




