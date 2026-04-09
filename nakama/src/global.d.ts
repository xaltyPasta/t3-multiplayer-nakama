declare namespace nkruntime {
    type Context = any;
    type Logger = any;
    type Nakama = any;
    type MatchDispatcher = any;
    type MatchMessage = any;
    type Presence = any;
    type Initializer = any;
    type MatchInitFunction = any;
    type MatchJoinAttemptFunction = any;
    type MatchJoinFunction = any;
    type MatchLoopFunction = any;
    type MatchLeaveFunction = any;
    type MatchTerminateFunction = any;
    type MatchSignalFunction = any;
    type StorageReadRequest = any;
    type StorageWriteRequest = any;

    // Use const enum so values are INLINED at compile time (no runtime reference to nkruntime)
    const enum SortOrder {
        ASCENDING = 0,
        DESCENDING = 1
    }

    const enum Operator {
        BEST = 0,
        SET = 1,
        INCREMENT = 2,
        DECREMENT = 3
    }
}
