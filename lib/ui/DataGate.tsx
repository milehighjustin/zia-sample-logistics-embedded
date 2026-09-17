'use client';

import EndlessSpinV2 from "./EndlessSpinV2";
import Button from "./Button";

/**
 * Spinner while a client-side backend fetch is in flight, a retry card if the
 * backend couldn't be reached at all, otherwise the content.
 */
export default function DataGate(props: {
  loading: boolean;
  error: boolean;
  reload: () => void;
  label?: string;
  children: React.ReactNode;
}) {
  if (props.loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <EndlessSpinV2 />
      </div>
    );
  }

  if (props.error) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-4 py-20">
        <div className="text-lg font-semibold text-gray-700">
          Couldn't load {props.label || 'this page'}
        </div>
        <div className="text-sm text-gray-500 text-center max-w-md">
          The backend didn't respond. This doesn't affect your Shopify session.
        </div>
        <Button size="md" clickAction={props.reload}>Retry</Button>
      </div>
    );
  }

  return <>{props.children}</>;
}
