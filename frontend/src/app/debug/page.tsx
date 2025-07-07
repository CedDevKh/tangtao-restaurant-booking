'use client';

export default function DebugPage() {
  const envVar = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
      <p><strong>NEXT_PUBLIC_BACKEND_API_URL:</strong> {envVar || 'undefined'}</p>
      <p><strong>All process.env keys starting with NEXT_PUBLIC:</strong></p>
      <pre className="bg-gray-100 p-4 mt-4">
        {JSON.stringify(
          Object.keys(process.env)
            .filter(key => key.startsWith('NEXT_PUBLIC'))
            .reduce((obj, key) => {
              obj[key] = process.env[key];
              return obj;
            }, {} as Record<string, any>),
          null,
          2
        )}
      </pre>
    </div>
  );
}
