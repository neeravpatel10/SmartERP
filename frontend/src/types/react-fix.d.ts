import React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
  }
}

declare module 'react' {
  interface ReactNode {
    children?: ReactNode | ReactNode[];
  }
}

export { }; 