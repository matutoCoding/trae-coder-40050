import { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ValidationRule {
  field: string;
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
  type?: 'number' | 'text';
  custom?: (value: unknown, allValues: Record<string, unknown>) => string | null;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'datetime-local';
  placeholder?: string;
  options?: { value: string; label: string }[];
  getOptions?: (values: Record<string, unknown>) => { value: string; label: string }[];
  dependsOn?: string;
  defaultValue?: string | number;
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
  className?: string;
}

export interface FormSection {
  title?: string;
  fields: FormField[];
}

export interface DynamicSection {
  title: string;
  addButtonText: string;
  fields: FormField[];
  keyName: string;
  minItems?: number;
  itemValidationRules?: ValidationRule[];
  filterEmpty?: boolean;
}

interface FormModalProps {
  isOpen: boolean;
  title: string;
  sections: FormSection[];
  dynamicSection?: DynamicSection;
  validationRules?: ValidationRule[];
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
  submitText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
};

export function validateForm(
  values: Record<string, unknown>,
  rules: ValidationRule[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const value = values[rule.field];
    const valueStr = String(value ?? '').trim();

    if (rule.required && (!value || valueStr === '')) {
      errors[rule.field] = `${rule.label}不能为空`;
      continue;
    }

    if (rule.type === 'number' && valueStr !== '') {
      const num = Number(value);
      if (isNaN(num)) {
        errors[rule.field] = `${rule.label}必须是有效的数字`;
        continue;
      }
      if (rule.min !== undefined && num < rule.min) {
        errors[rule.field] = `${rule.label}不能小于${rule.min}`;
        continue;
      }
      if (rule.max !== undefined && num > rule.max) {
        errors[rule.field] = `${rule.label}不能大于${rule.max}`;
        continue;
      }
    }

    if (rule.custom) {
      const customError = rule.custom(value, values);
      if (customError) {
        errors[rule.field] = customError;
      }
    }
  }

  return errors;
}

function validateDynamicItems(
  items: Record<string, unknown>[],
  rules: ValidationRule[],
  sectionTitle: string
): { errors: Record<string, string>; errorList: string[] } {
  const errors: Record<string, string> = {};
  const errorList: string[] = [];

  items.forEach((item, index) => {
    const itemErrors = validateForm(item, rules);
    if (Object.keys(itemErrors).length > 0) {
      Object.entries(itemErrors).forEach(([field, message]) => {
        errors[`${sectionTitle}-${index}-${field}`] = message;
        errorList.push(`第${index + 1}条${message}`);
      });
    }
  });

  return { errors, errorList };
}

function isEmptyItem(item: Record<string, unknown>): boolean {
  return Object.values(item).every((v) => {
    if (v === undefined || v === null) return true;
    if (typeof v === 'string') return v.trim() === '';
    if (typeof v === 'number') return isNaN(v);
    return false;
  });
}

export default function FormModal({
  isOpen,
  title,
  sections,
  dynamicSection,
  validationRules = [],
  onClose,
  onSubmit,
  submitText = '保存',
  size = 'md',
}: FormModalProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [dynamicItems, setDynamicItems] = useState<Record<string, unknown>[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorList, setErrorList] = useState<string[]>([]);

  const resolvedFields = useMemo(() => {
    const resolved: Record<string, { value: string; label: string }[]> = {};
    sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.getOptions) {
          resolved[field.name] = field.getOptions(values);
        }
      });
    });
    return resolved;
  }, [sections, values]);

  useEffect(() => {
    if (isOpen) {
      const initialValues: Record<string, unknown> = {};
      sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.defaultValue !== undefined) {
            initialValues[field.name] = field.defaultValue;
          }
        });
      });
      setValues(initialValues);
      setDynamicItems(dynamicSection ? [] : []);
      setErrors({});
      setErrorList([]);
      setShowSuccess(false);
    }
  }, [isOpen, sections, dynamicSection]);

  useEffect(() => {
    sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.dependsOn && field.getOptions) {
          const options = field.getOptions(values);
          const currentValue = String(values[field.name] ?? '');
          const hasValue = options.some((o) => o.value === currentValue);
          if (!hasValue && currentValue !== '') {
            setValues((prev) => ({ ...prev, [field.name]: '' }));
          }
        }
      });
    });
  }, [values, sections]);

  if (!isOpen) return null;

  const handleChange = (name: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDynamicChange = (index: number, name: string, value: string | number) => {
    setDynamicItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [name]: value };
      return newItems;
    });
  };

  const addDynamicItem = () => {
    const newItem: Record<string, unknown> = {};
    dynamicSection?.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        newItem[field.name] = field.defaultValue;
      }
    });
    setDynamicItems((prev) => [...prev, newItem]);
  };

  const removeDynamicItem = (index: number) => {
    setDynamicItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const newErrorList: string[] = [];

    const formErrors = validateForm(values, validationRules);
    Object.assign(newErrors, formErrors);
    newErrorList.push(...Object.values(formErrors));

    if (dynamicSection) {
      const items = dynamicSection.filterEmpty
        ? dynamicItems.filter((item) => !isEmptyItem(item))
        : dynamicItems;

      if (dynamicSection.minItems !== undefined && items.length < dynamicSection.minItems) {
        newErrors[`${dynamicSection.keyName}-min`] = `${dynamicSection.title}至少需要${dynamicSection.minItems}条记录`;
        newErrorList.push(`${dynamicSection.title}至少需要${dynamicSection.minItems}条有效记录`);
      }

      if (dynamicSection.itemValidationRules && items.length > 0) {
        const { errors: itemErrors, errorList: itemErrorList } = validateDynamicItems(
          items,
          dynamicSection.itemValidationRules,
          dynamicSection.title
        );
        Object.assign(newErrors, itemErrors);
        newErrorList.push(...itemErrorList);
      }
    }

    setErrors(newErrors);
    setErrorList(newErrorList);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const submitData = { ...values };
    if (dynamicSection) {
      const items = dynamicSection.filterEmpty
        ? dynamicItems.filter((item) => !isEmptyItem(item))
        : dynamicItems;
      submitData[dynamicSection.keyName] = items;
    }

    setShowSuccess(true);
    setTimeout(() => {
      onSubmit(submitData);
    }, 500);
  };

  const handleCancel = () => {
    onClose();
  };

  const getFieldOptions = (field: FormField) => {
    if (field.getOptions) {
      return resolvedFields[field.name] || [];
    }
    return field.options || [];
  };

  const renderField = (
    field: FormField,
    value: unknown,
    onChange: (name: string, value: string | number) => void,
    errorPrefix = ''
  ) => {
    const fieldName = field.name;
    const errorKey = errorPrefix ? `${errorPrefix}-${field.name}` : field.name;
    const fieldValue = String(value ?? '');
    const hasError = !!errors[errorKey];

    const baseInputClass = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      hasError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
    }`;

    const options = getFieldOptions(field);
    const isDisabled = field.dependsOn && !values[field.dependsOn];

    const getDependsOnLabel = () => {
      if (!field.dependsOn) return '';
      for (const section of sections) {
        const found = section.fields.find((f) => f.name === field.dependsOn);
        if (found) return found.label;
      }
      return field.dependsOn;
    };

    return (
      <div key={fieldName} className={field.className || ''}>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.type === 'text' && (
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        )}
        {field.type === 'number' && (
          <input
            type="number"
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            step={field.step}
            min={field.min}
            max={field.max}
            className={baseInputClass}
          />
        )}
        {field.type === 'textarea' && (
          <textarea
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={baseInputClass}
          />
        )}
        {field.type === 'select' && (
          <select
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={isDisabled}
            className={`${baseInputClass} ${isDisabled ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''}`}
          >
            <option value="">
              {isDisabled ? `请先选择${getDependsOnLabel()}` : field.placeholder || '请选择'}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        {field.type === 'datetime-local' && (
          <input
            type="datetime-local"
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={baseInputClass}
          />
        )}
        {hasError && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors[errorKey]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {showSuccess ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <p className="text-lg font-semibold text-slate-800">保存成功！</p>
              <p className="text-sm text-slate-500 mt-1">记录已添加到列表中</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {sections.map((section, secIdx) => (
                <div key={secIdx}>
                  {section.title && (
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
                      {section.title}
                    </h4>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map((field) =>
                      renderField(field, values[field.name], handleChange)
                    )}
                  </div>
                </div>
              ))}

              {dynamicSection && (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700">
                      {dynamicSection.title}
                      {dynamicSection.minItems && (
                        <span className="text-xs font-normal text-slate-400 ml-2">
                          （至少{dynamicSection.minItems}条）
                        </span>
                      )}
                    </h4>
                    <button
                      type="button"
                      onClick={addDynamicItem}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      + {dynamicSection.addButtonText}
                    </button>
                  </div>

                  {dynamicItems.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
                      点击上方「{dynamicSection.addButtonText}」按钮添加记录
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dynamicItems.map((item, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-xl relative">
                          <button
                            type="button"
                            onClick={() => removeDynamicItem(index)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X size={16} />
                          </button>
                          <p className="text-xs font-medium text-slate-500 mb-3">
                            记录 #{index + 1}
                            {errors[`${dynamicSection.title}-${index}-`] ||
                            Object.keys(errors).some(
                              (k) =>
                                k.startsWith(`${dynamicSection.title}-${index}-`)
                            ) ? (
                              <span className="text-red-500 ml-2">存在错误</span>
                            ) : null}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {dynamicSection.fields.map((field) =>
                              renderField(
                                field,
                                item[field.name],
                                (name, value) => handleDynamicChange(index, name, value),
                                `${dynamicSection.title}-${index}`
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {errorList.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertCircle size={16} />
                    <p className="text-sm font-medium">请检查以下问题：</p>
                  </div>
                  <ul className="text-xs text-red-600 space-y-1 ml-6 list-disc">
                    {errorList.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                {submitText}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
