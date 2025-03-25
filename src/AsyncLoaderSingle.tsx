import { JSX } from "react";

interface IAsyncLoaderSingleProps {
    Component: JSX.Element;
    index: number;
    status: {
        isLoading: boolean;
        hasSucceeded: boolean;
        hasFailed: boolean;
    };
    onRetry?: (index: number) => void;
}

const AsyncLoaderSingle = ({
    Component,
    onRetry,
    status,
    index,
}: IAsyncLoaderSingleProps) => {
    return (
        <div>
            {Component}
            <div>
                {status.isLoading && <span>Loading</span>}
                {status.hasSucceeded && <span>Done</span>}
                {status.hasFailed && (
                    <>
                        <span>Failed</span>
                        <span onClick={() => onRetry && onRetry(index)}>
                            Retry
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};

export default AsyncLoaderSingle;
