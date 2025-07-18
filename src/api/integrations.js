// Local mock integrations for offline/local usage

export const Core = {
  InvokeLLM: async (...args) => {
    alert('LLM invoked (mock)');
    return { result: 'LLM mock result', args };
  },
  SendEmail: async (...args) => {
    alert('Email sent (mock)');
    return { success: true, args };
  },
  UploadFile: async (...args) => {
    alert('File uploaded (mock)');
    return { url: 'mock://file', args };
  },
  GenerateImage: async (...args) => {
    alert('Image generated (mock)');
    return { url: 'mock://image', args };
  },
  ExtractDataFromUploadedFile: async (...args) => {
    alert('Data extracted from file (mock)');
    return { data: {}, args };
  }
};

export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;






