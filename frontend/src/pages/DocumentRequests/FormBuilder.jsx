import { useState } from "react";
import {
  PlusIcon,
  TrashIcon,
  Bars3Icon,
  DocumentTextIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentArrowUpIcon,
  ChevronDownIcon,
  CheckIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

const fieldTypes = [
  { value: "text", label: "Text", icon: DocumentTextIcon },
  { value: "textarea", label: "Long Text", icon: ChatBubbleBottomCenterTextIcon },
  { value: "file", label: "File Upload", icon: DocumentArrowUpIcon },
  { value: "select", label: "Dropdown", icon: ChevronDownIcon },
  { value: "checkbox", label: "Checkbox", icon: CheckIcon },
  { value: "date", label: "Date", icon: CalendarIcon },
  { value: "email", label: "Email", icon: EnvelopeIcon },
  { value: "phone", label: "Phone", icon: PhoneIcon },
];

function FormBuilder({ fields, onChange }) {
  const [draggedIndex, setDraggedIndex] = useState(null);

  const addField = () => {
    const newField = {
      name: `field_${Date.now()}`,
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      options: [],
      order: fields.length,
    };
    onChange([...fields, newField]);
  };

  const updateField = (index, updates) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const removeField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields.map((f, i) => ({ ...f, order: i })));
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFields = [...fields];
    const draggedField = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedField);
    onChange(newFields.map((f, i) => ({ ...f, order: i })));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const addOption = (fieldIndex) => {
    const newFields = [...fields];
    const options = newFields[fieldIndex].options || [];
    options.push("");
    newFields[fieldIndex].options = options;
    onChange(newFields);
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    const newFields = [...fields];
    newFields[fieldIndex].options[optionIndex] = value;
    onChange(newFields);
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const newFields = [...fields];
    newFields[fieldIndex].options.splice(optionIndex, 1);
    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Form Fields</h3>
        <button
          onClick={addField}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
        >
          <PlusIcon className="h-4 w-4" />
          Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <DocumentTextIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No fields yet</p>
          <button
            onClick={addField}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Add your first field
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.name}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-gray-50 rounded-lg p-4 border ${
                draggedIndex === index ? "border-blue-400 shadow-lg" : "border-gray-200"
              } cursor-move`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-2 cursor-grab">
                  <Bars3Icon className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Field Label
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Enter field label"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Field Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {fieldTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {field.type !== "checkbox" && field.type !== "file" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Placeholder
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ""}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {field.type === "select" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Options
                      </label>
                      <div className="space-y-2">
                        {(field.options || []).map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => removeOption(index, optIndex)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(index)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          + Add option
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`required-${index}`} className="ml-2 text-sm text-gray-600">
                      Required field
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => removeField(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormBuilder;
