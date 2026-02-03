import { Badge } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Switch } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nextpik/ui';
import { Settings2 } from 'lucide-react';

interface ConfigField {
  key: string;
  label: string;
  type: 'toggle' | 'select' | 'input';
  description?: string;
  value: any;
  options?: { value: string; label: string }[];
  placeholder?: string;
  maxLength?: number;
  onChange: (value: any) => void;
  disabled?: boolean;
}

interface GatewayBusinessConfigProps {
  title?: string;
  fields: ConfigField[];
}

export function GatewayBusinessConfig({ title = 'Business Configuration', fields }: GatewayBusinessConfigProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">{title}</h4>
        <Badge variant="outline" className="text-xs">
          Editable
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          if (field.type === 'toggle') {
            return (
              <div key={field.key} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                </div>
                <Switch
                  id={field.key}
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  disabled={field.disabled}
                />
              </div>
            );
          }

          if (field.type === 'select') {
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={field.disabled}
                >
                  <SelectTrigger id={field.key}>
                    <SelectValue placeholder={field.placeholder || 'Select option'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
            );
          }

          if (field.type === 'input') {
            return (
              <div key={field.key} className="space-y-2 md:col-span-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type="text"
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  defaultValue={field.value || ''}
                  onBlur={(e) => {
                    if (e.target.value !== field.value) {
                      field.onChange(e.target.value);
                    }
                  }}
                  disabled={field.disabled}
                />
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    </>
  );
}
