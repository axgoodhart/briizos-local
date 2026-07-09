var e = {
        Canceled: 1,
        Unknown: 2,
        InvalidArgument: 3,
        DeadlineExceeded: 4,
        NotFound: 5,
        AlreadyExists: 6,
        PermissionDenied: 7,
        ResourceExhausted: 8,
        FailedPrecondition: 9,
        Aborted: 10,
        OutOfRange: 11,
        Unimplemented: 12,
        Internal: 13,
        Unavailable: 14,
        DataLoss: 15,
        Unauthenticated: 16
    },
    t = Object.fromEntries(Object.entries(e).map(([e, t]) => [t, e]));

function n(e) {
    return t[e] ? ? String(e)
}

function r(e) {
    return e instanceof Error && e.name === `ConnectError` && `code` in e && typeof e.code == `number` && `rawMessage` in e && typeof e.rawMessage == `string`
}
export {
    n,
    r,
    e as t
};