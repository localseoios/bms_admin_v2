import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  UserIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import FormBuilder from "./FormBuilder";
import axiosInstance from "../../utils/axios";
import toast from "react-hot-toast";

function SendRequestModal({ isOpen, onClose, client, onSuccess }) {
  const [formData, setFormData] = useState({
    subject: "Document Request",
    message: "",
    expiryDays: 7,
    noExpiry: false,
    allowMultipleSubmissions: false,
    allowCustomerFields: false,
    customFields: [],
  });
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const isManualMode = !client;

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setFormData({
        subject: "Document Request",
        message: "",
        expiryDays: 7,
        noExpiry: false,
        allowMultipleSubmissions: false,
        allowCustomerFields: false,
        customFields: [],
      });
      setSelectedTemplate("");
      setManualEmail("");
      setManualName("");
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await axiosInstance.get("/document-requests/templates");
      setTemplates(response.data.templates || []);
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find((t) => t._id === templateId);
      if (template) {
        setFormData((prev) => ({
          ...prev,
          customFields: template.fields || [],
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isManualMode && !manualEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (isManualMode && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(manualEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (formData.customFields.length === 0) {
      toast.error("Please add at least one form field");
      return;
    }

    const hasEmptyLabels = formData.customFields.some((f) => !f.label.trim());
    if (hasEmptyLabels) {
      toast.error("Please fill in all field labels");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        subject: formData.subject,
        message: formData.message,
        expiryDays: formData.noExpiry ? null : formData.expiryDays,
        noExpiry: formData.noExpiry,
        allowMultipleSubmissions: formData.allowMultipleSubmissions,
        allowCustomerFields: formData.allowCustomerFields,
        customFields: formData.customFields.map((f, i) => ({
          ...f,
          name: f.name || `field_${i}`,
          order: i,
        })),
      };

      if (client) {
        payload.clientId = client._id;
      } else {
        payload.manualEmail = manualEmail.trim();
        payload.manualName = manualName.trim() || manualEmail.trim();
      }

      if (selectedTemplate) {
        payload.templateId = selectedTemplate;
      }

      const response = await axiosInstance.post("/document-requests", payload);
      toast.success("Document request sent successfully!");
      onSuccess?.(response.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      Request Documents
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">
                      {isManualMode ? "Send a document request via email" : "Send a document request to the client"}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {isManualMode ? (
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 space-y-3">
                      <h4 className="text-sm font-medium text-orange-800">Recipient Details</h4>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Email Address *
                        </label>
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                          <input
                            type="email"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                            placeholder="client@example.com"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Recipient Name (Optional)
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                          <input
                            type="text"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                            placeholder="Client name"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Client</h4>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {client?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">{client?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                            <span>{client?.gmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {templates.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Use Template (Optional)
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Create custom form</option>
                        {templates.map((template) => (
                          <option key={template._id} value={template._id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Document Request"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message to Client *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide the following documents..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Expiry
                    </label>
                    <div className="flex items-center gap-4 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.noExpiry}
                          onChange={(e) => setFormData({ ...formData, noExpiry: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">No Expiry (Link never expires)</span>
                      </label>
                    </div>
                    {!formData.noExpiry && (
                      <select
                        value={formData.expiryDays}
                        onChange={(e) => setFormData({ ...formData, expiryDays: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={3}>3 days</option>
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                      </select>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Submission Options</h4>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowMultipleSubmissions}
                        onChange={(e) => setFormData({ ...formData, allowMultipleSubmissions: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Allow Multiple Submissions</span>
                        <p className="text-xs text-gray-500">Customer can submit the form multiple times</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowCustomerFields}
                        onChange={(e) => setFormData({ ...formData, allowCustomerFields: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Allow Customer to Add Fields</span>
                        <p className="text-xs text-gray-500">Customer can add additional fields when filling the form</p>
                      </div>
                    </label>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <FormBuilder
                      fields={formData.customFields}
                      onChange={(fields) => setFormData({ ...formData, customFields: fields })}
                    />
                  </div>
                </form>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <PaperAirplaneIcon className="h-4 w-4" />
                    )}
                    Send Request
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default SendRequestModal;
