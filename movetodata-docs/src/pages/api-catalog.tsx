import React from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './api-catalog.module.css';

export default function ApiCatalog(): JSX.Element {
  const specUrl = useBaseUrl('/movetodata-api-docs.json');

  return (
    <Layout
      title="API Catalog"
      description="MoveToData API Reference — all service endpoints for Passport, Connect, Kepler, Kitab, Dataset, Build, Scheduler, AccessManager and more."
    >
      <div className={styles.header}>
        <h1 className={styles.title}>API Catalog</h1>
        <p className={styles.subtitle}>
          Interactive reference for the MoveToData platform REST API (v1.0.1).
          Authenticate with a Bearer token obtained from the Passport service, then
          explore and try out every endpoint directly from this page.
        </p>
      </div>

      <div className={styles.swaggerWrapper}>
        <BrowserOnly fallback={<div className={styles.loading}>Loading API reference…</div>}>
          {() => {
            // Dynamic require keeps swagger-ui out of the SSR bundle and avoids
            // the "window is not defined" error during Docusaurus static builds.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const SwaggerUI = require('swagger-ui-react').default as React.ComponentType<{
              url: string;
              docExpansion: string;
              defaultModelsExpandDepth: number;
              displayRequestDuration: boolean;
              tryItOutEnabled: boolean;
            }>;
            // CSS import inside BrowserOnly so it is never evaluated server-side.
            require('swagger-ui-react/swagger-ui.css');
            return (
              <SwaggerUI
                url={specUrl}
                docExpansion="list"
                defaultModelsExpandDepth={-1}
                displayRequestDuration={true}
                tryItOutEnabled={false}
              />
            );
          }}
        </BrowserOnly>
      </div>
    </Layout>
  );
}
