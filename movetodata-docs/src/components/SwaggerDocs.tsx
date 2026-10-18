import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

interface Props {
  url: string;
}

export default function SwaggerDocs({ url }: Props): React.ReactElement {
  return (
    <SwaggerUI
      url={url}
      docExpansion="list"
      defaultModelsExpandDepth={-1}
      displayRequestDuration={true}
      tryItOutEnabled={false}
    />
  );
}
