declare module 'react-hook-form' {
  export type FieldValues = Record<string, any>;

  export type UseFormReturn<TFieldValues extends FieldValues = FieldValues, TContext = any> = {
    watch: {
      (name: string): any;
      (names: string[]): Record<string, any>;
      (callback: (value: any, info: { name?: string; type?: any }) => void): () => void;
      (): Record<string, any>;
    };
    getValues: (fieldName?: string | string[]) => any;
    getFieldState: (name: string) => { invalid: boolean; isTouched: boolean; isDirty: boolean };
    setError: (name: string, error: { type: string; message: string }) => void;
    clearErrors: (name?: string | string[]) => void;
    setValue: (name: string, value: any, config?: any) => void;
    trigger: (name?: string | string[]) => Promise<boolean>;
    formState: {
      isDirty: boolean;
      isSubmitting: boolean;
      isSubmitted: boolean;
      isSubmitSuccessful: boolean;
      isValid: boolean;
      isValidating: boolean;
      submitCount: number;
      errors: Record<string, any>;
    };
    reset: (values?: any, options?: any) => void;
    handleSubmit: (onValid: (data: TFieldValues, e?: any) => any, onInvalid?: (errors: any, e?: any) => any) => (e?: any) => void;
    unregister: (name?: string | string[]) => void;
    control: any;
    register: (name: string, options?: any) => any;
  };

  export function useForm<TFieldValues extends FieldValues = FieldValues, TContext = any>(
    props?: any
  ): UseFormReturn<TFieldValues, TContext>;

  export function Controller(props: {
    name: string;
    control: any;
    defaultValue?: any;
    render: ({ field, fieldState }: { field: any; fieldState: any }) => React.ReactElement;
  }): React.ReactElement;
}

declare module '@hookform/resolvers/yup' {
  import * as yup from 'yup';
  
  export function yupResolver(schema: yup.Schema<any>): any;
}
