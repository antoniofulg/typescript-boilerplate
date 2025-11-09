import { toast as sonnerToast } from 'sonner';

export function useToast() {
  return {
    success: (message: string, options?: { description?: string }) => {
      sonnerToast.success(message, {
        description: options?.description,
        duration: 3000,
      });
    },
    error: (message: string, options?: { description?: string }) => {
      sonnerToast.error(message, {
        description: options?.description,
        duration: 4000,
      });
    },
    info: (message: string, options?: { description?: string }) => {
      sonnerToast.info(message, {
        description: options?.description,
        duration: 3000,
      });
    },
    warning: (message: string, options?: { description?: string }) => {
      sonnerToast.warning(message, {
        description: options?.description,
        duration: 3000,
      });
    },
  };
}
