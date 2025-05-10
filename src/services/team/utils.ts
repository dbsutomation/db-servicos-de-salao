
import { toast } from '@/hooks/use-toast';

// Helper function to handle common error cases
export const handleError = (error: any, action: string): void => {
  let errorMessage = error.message || `Ocorreu um erro ${action}`;
  
  // Specific error code handling
  if (error.code === '23505') {
    errorMessage = "Este email já está em uso por outro membro";
  } else if (error.code === '23514') {
    errorMessage = "Os dados fornecidos não atendem às restrições do banco de dados";
  }
  
  console.error("Detailed error:", error);
  
  toast({
    title: "Erro",
    description: errorMessage,
    variant: "destructive"
  });
};
