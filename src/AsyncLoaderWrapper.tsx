import { JSX, useEffect, useState } from "react";
import AsyncLoaderSingle from "./AsyncLoaderSingle";

interface IExecutionWrapperProps {
    list: {
        Element: JSX.Element;
        apiToExecute: (previousResponseData?: unknown) => Promise<unknown>;
        onResolve?: () => void;
        onFail?: () => void;
        onAbort?: () => void;
    }[];
    shouldRunParallel: boolean;
}

type TTaskQueue = {
    apiCallToExecute: (responseData?: unknown) => Promise<unknown>;
    Element: JSX.Element;
    status: {
        isLoading: boolean;
        hasSucceeded: boolean;
        hasFailed: boolean;
    };
};
const ExecutionWrapper = ({
    list,
    shouldRunParallel,
}: IExecutionWrapperProps) => {
    const [taskQueue, setTaskQueue] = useState<TTaskQueue[]>([]);
    const startQueue = () => {
        setTaskQueue((prevState) => {
            return prevState.map((state) => ({
                ...state,
                status: {
                    ...state.status,
                    isLoading: true,
                },
            }));
        });
        for (let i = 0; i < taskQueue.length; i++) {
            taskQueue[i]
                .apiCallToExecute()
                .then(() => {
                    updateTaskStatus(i, { hasSucceeded: true });
                })
                .catch(() => {
                    updateTaskStatus(i, { hasFailed: true });
                })
                .finally(() => {
                    updateTaskStatus(i, { isLoading: false });
                });
        }
    };
    useEffect(() => {
        const withStatusQueueList: TTaskQueue[] = list.map((singleList) => {
            return {
                Element: singleList.Element,
                apiCallToExecute: singleList.apiToExecute,
                status: {
                    isLoading: false,
                    hasSucceeded: false,
                    hasFailed: false,
                },
            };
        });
        setTaskQueue(withStatusQueueList);
    }, [list]);

    async function makeSequentialApiCalls() {
        let responseData = null;
        for (let i = 0; i < taskQueue.length; i++) {
            try {
                updateTaskStatus(i, { isLoading: true });

                const endpoint = taskQueue[i].apiCallToExecute(responseData);

                const response = await endpoint;
                updateTaskStatus(i, { hasSucceeded: true });

                responseData = response;
            } catch {
                updateTaskStatus(i, { hasFailed: true });
            } finally {
                updateTaskStatus(i, { isLoading: false });
            }
        }
    }

    const handleStart = () => {
        return shouldRunParallel ? startQueue() : makeSequentialApiCalls();
    };
    const updateTaskStatus = (
        index: number,
        statusUpdate: Record<string, boolean>
    ) => {
        setTaskQueue((prevState) =>
            prevState.map((state, i) =>
                i === index
                    ? { ...state, status: { ...state.status, ...statusUpdate } }
                    : state
            )
        );
    };
    const handleRetry = (index: number) => {
        const updateTaskQueue = [...taskQueue];
        updateTaskQueue[index].status = {
            ...updateTaskQueue[index].status,
            isLoading: true,
            hasFailed: false,
        };
        setTaskQueue(updateTaskQueue);
        taskQueue[index]
            .apiCallToExecute()
            .then(() => {
                updateTaskStatus(index, { hasSucceeded: true });
            })
            .catch(() => {
                updateTaskStatus(index, { hasFailed: true });
            })
            .finally(() => {
                updateTaskStatus(index, { isLoading: false });
            });
    };
    return (
        <div>
            {taskQueue.map((singleList, index) => {
                return (
                    <AsyncLoaderSingle
                        key={index}
                        Component={singleList.Element}
                        status={taskQueue[index].status}
                        onRetry={handleRetry}
                        index={index}
                    />
                );
            })}
            <button onClick={handleStart}>Start</button>
        </div>
    );
};

export default ExecutionWrapper;
