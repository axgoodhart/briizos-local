import {
    r as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    E as t,
    a as n,
    d as r,
    l as i,
    n as a,
    o,
    s,
    t as c
} from "./client-lite-BraEm36W.js";
import {
    t as l
} from "./host-BwlQdwMG.js";

function u(e) {
    let t = !1,
        n = [];
    for (let r = 0; r < e.length; r++) {
        let i = e.charAt(r);
        switch (i) {
            case `_`:
                t = !0;
                break;
            case `0`:
            case `1`:
            case `2`:
            case `3`:
            case `4`:
            case `5`:
            case `6`:
            case `7`:
            case `8`:
            case `9`:
                n.push(i), t = !1;
                break;
            default:
                t && (t = !1, i = i.toUpperCase()), n.push(i);
                break
        }
    }
    return n.join(``)
}

function d(e) {
    return e.replace(/[A-Z]/g, e => `_` + e.toLowerCase())
}
var f = new Set([`constructor`, `toString`, `toJSON`, `valueOf`]);

function p(e) {
    return f.has(e) ? e + `$` : e
}

function m() {
    let e = 0,
        t = 0;
    for (let n = 0; n < 28; n += 7) {
        let r = this.buf[this.pos++];
        if (e |= (r & 127) << n, !(r & 128)) return this.assertBounds(), [e, t]
    }
    let n = this.buf[this.pos++];
    if (e |= (n & 15) << 28, t = (n & 112) >> 4, !(n & 128)) return this.assertBounds(), [e, t];
    for (let n = 3; n <= 31; n += 7) {
        let r = this.buf[this.pos++];
        if (t |= (r & 127) << n, !(r & 128)) return this.assertBounds(), [e, t]
    }
    throw Error(`invalid varint`)
}

function h(e, t, n) {
    for (let r = 0; r < 28; r += 7) {
        let i = e >>> r,
            a = !(!(i >>> 7) && t == 0),
            o = (a ? i | 128 : i) & 255;
        if (n.push(o), !a) return
    }
    let r = e >>> 28 & 15 | (t & 7) << 4,
        i = !!(t >> 3);
    if (n.push((i ? r | 128 : r) & 255), i) {
        for (let e = 3; e < 31; e += 7) {
            let r = t >>> e,
                i = !!(r >>> 7),
                a = (i ? r | 128 : r) & 255;
            if (n.push(a), !i) return
        }
        n.push(t >>> 31 & 1)
    }
}
var g = 4294967296;

function ee(e) {
    let t = e[0] === `-`;
    t && (e = e.slice(1));
    let n = 1e6,
        r = 0,
        i = 0;

    function a(t, a) {
        let o = Number(e.slice(t, a));
        i *= n, r = r * n + o, r >= g && (i += r / g | 0, r %= g)
    }
    return a(-24, -18), a(-18, -12), a(-12, -6), a(-6), t ? ie(r, i) : re(r, i)
}

function te(e, t) {
    let n = re(e, t),
        r = n.hi & 2147483648;
    r && (n = ie(n.lo, n.hi));
    let i = _(n.lo, n.hi);
    return r ? `-` + i : i
}

function _(e, t) {
    if ({
            lo: e,
            hi: t
        } = ne(e, t), t <= 2097151) return String(g * t + e);
    let n = e & 16777215,
        r = (e >>> 24 | t << 8) & 16777215,
        i = t >> 16 & 65535,
        a = n + r * 6777216 + i * 6710656,
        o = r + i * 8147497,
        s = i * 2,
        c = 1e7;
    return a >= c && (o += Math.floor(a / c), a %= c), o >= c && (s += Math.floor(o / c), o %= c), s.toString() + ae(o) + ae(a)
}

function ne(e, t) {
    return {
        lo: e >>> 0,
        hi: t >>> 0
    }
}

function re(e, t) {
    return {
        lo: e | 0,
        hi: t | 0
    }
}

function ie(e, t) {
    return t = ~t, e ? e = ~e + 1 : t += 1, re(e, t)
}
var ae = e => {
    let t = String(e);
    return `0000000`.slice(t.length) + t
};

function oe(e, t) {
    if (e >= 0) {
        for (; e > 127;) t.push(e & 127 | 128), e >>>= 7;
        t.push(e)
    } else {
        for (let n = 0; n < 9; n++) t.push(e & 127 | 128), e >>= 7;
        t.push(1)
    }
}

function se() {
    let e = this.buf[this.pos++],
        t = e & 127;
    if (!(e & 128) || (e = this.buf[this.pos++], t |= (e & 127) << 7, !(e & 128)) || (e = this.buf[this.pos++], t |= (e & 127) << 14, !(e & 128)) || (e = this.buf[this.pos++], t |= (e & 127) << 21, !(e & 128))) return this.assertBounds(), t;
    e = this.buf[this.pos++], t |= (e & 15) << 28;
    for (let t = 5; e & 128 && t < 10; t++) e = this.buf[this.pos++];
    if (e & 128) throw Error(`invalid varint`);
    return this.assertBounds(), t >>> 0
}
var v = ce();

function ce() {
    let e = new DataView(new ArrayBuffer(8));
    if (typeof BigInt == `function` && typeof e.getBigInt64 == `function` && typeof e.getBigUint64 == `function` && typeof e.setBigInt64 == `function` && typeof e.setBigUint64 == `function` && (globalThis.Deno || typeof process != `object` || {}.BUF_BIGINT_DISABLE !== `1`)) {
        let t = BigInt(`-9223372036854775808`),
            n = BigInt(`9223372036854775807`),
            r = BigInt(`0`),
            i = BigInt(`18446744073709551615`);
        return {
            zero: BigInt(0),
            supported: !0,
            parse(e) {
                let r = typeof e == `bigint` ? e : BigInt(e);
                if (r > n || r < t) throw Error(`invalid int64: ${e}`);
                return r
            },
            uParse(e) {
                let t = typeof e == `bigint` ? e : BigInt(e);
                if (t > i || t < r) throw Error(`invalid uint64: ${e}`);
                return t
            },
            enc(t) {
                return e.setBigInt64(0, this.parse(t), !0), {
                    lo: e.getInt32(0, !0),
                    hi: e.getInt32(4, !0)
                }
            },
            uEnc(t) {
                return e.setBigInt64(0, this.uParse(t), !0), {
                    lo: e.getInt32(0, !0),
                    hi: e.getInt32(4, !0)
                }
            },
            dec(t, n) {
                return e.setInt32(0, t, !0), e.setInt32(4, n, !0), e.getBigInt64(0, !0)
            },
            uDec(t, n) {
                return e.setInt32(0, t, !0), e.setInt32(4, n, !0), e.getBigUint64(0, !0)
            }
        }
    }
    return {
        zero: `0`,
        supported: !1,
        parse(e) {
            return typeof e != `string` && (e = e.toString()), le(e), e
        },
        uParse(e) {
            return typeof e != `string` && (e = e.toString()), ue(e), e
        },
        enc(e) {
            return typeof e != `string` && (e = e.toString()), le(e), ee(e)
        },
        uEnc(e) {
            return typeof e != `string` && (e = e.toString()), ue(e), ee(e)
        },
        dec(e, t) {
            return te(e, t)
        },
        uDec(e, t) {
            return _(e, t)
        }
    }
}

function le(e) {
    if (!/^-?[0-9]+$/.test(e)) throw Error(`invalid int64: ` + e)
}

function ue(e) {
    if (!/^[0-9]+$/.test(e)) throw Error(`invalid uint64: ` + e)
}
var y;
(function(e) {
    e[e.DOUBLE = 1] = `DOUBLE`, e[e.FLOAT = 2] = `FLOAT`, e[e.INT64 = 3] = `INT64`, e[e.UINT64 = 4] = `UINT64`, e[e.INT32 = 5] = `INT32`, e[e.FIXED64 = 6] = `FIXED64`, e[e.FIXED32 = 7] = `FIXED32`, e[e.BOOL = 8] = `BOOL`, e[e.STRING = 9] = `STRING`, e[e.BYTES = 12] = `BYTES`, e[e.UINT32 = 13] = `UINT32`, e[e.SFIXED32 = 15] = `SFIXED32`, e[e.SFIXED64 = 16] = `SFIXED64`, e[e.SINT32 = 17] = `SINT32`, e[e.SINT64 = 18] = `SINT64`
})(y || = {});

function b(e, t) {
    switch (e) {
        case y.STRING:
            return ``;
        case y.BOOL:
            return !1;
        case y.DOUBLE:
        case y.FLOAT:
            return 0;
        case y.INT64:
        case y.UINT64:
        case y.SFIXED64:
        case y.FIXED64:
        case y.SINT64:
            return t ? `0` : v.zero;
        case y.BYTES:
            return new Uint8Array;
        default:
            return 0
    }
}

function de(e, t) {
    switch (e) {
        case y.BOOL:
            return t === !1;
        case y.STRING:
            return t === ``;
        case y.BYTES:
            return t instanceof Uint8Array && !t.byteLength;
        default:
            return t == 0
    }
}
var fe = 2,
    x = Symbol.for(`reflect unsafe local`);

function pe(e, t) {
    let n = e[t.localName].case;
    return n === void 0 ? n : t.fields.find(e => e.localName === n)
}

function me(e, t) {
    let n = t.localName;
    if (t.oneof) return e[t.oneof.localName].case === n;
    if (t.presence != fe) return e[n] !== void 0 && Object.prototype.hasOwnProperty.call(e, n);
    switch (t.fieldKind) {
        case `list`:
            return e[n].length > 0;
        case `map`:
            return Object.keys(e[n]).length > 0;
        case `scalar`:
            return !de(t.scalar, e[n]);
        case `enum`:
            return e[n] !== t.enum.values[0].number
    }
    throw Error(`message field with implicit presence`)
}

function he(e, t) {
    return Object.prototype.hasOwnProperty.call(e, t) && e[t] !== void 0
}

function ge(e, t) {
    if (t.oneof) {
        let n = e[t.oneof.localName];
        return n.case === t.localName ? n.value : void 0
    }
    return e[t.localName]
}

function _e(e, t, n) {
    t.oneof ? e[t.oneof.localName] = {
        case: t.localName,
        value: n
    } : e[t.localName] = n
}

function ve(e, t) {
    let n = t.localName;
    if (t.oneof) {
        let r = t.oneof.localName;
        e[r].case === n && (e[r] = {
            case: void 0
        })
    } else if (t.presence != fe) delete e[n];
    else switch (t.fieldKind) {
        case `map`:
            e[n] = {};
            break;
        case `list`:
            e[n] = [];
            break;
        case `enum`:
            e[n] = t.enum.values[0].number;
            break;
        case `scalar`:
            e[n] = b(t.scalar, t.longAsString);
            break
    }
}

function ye(e) {
    for (let t of e.field) he(t, `jsonName`) || (t.jsonName = u(t.name));
    e.nestedType.forEach(ye)
}

function be(e, t) {
    let n = e.values.find(e => e.name === t);
    if (!n) throw Error(`cannot parse ${e} default value: ${t}`);
    return n.number
}

function xe(e, t) {
    switch (e) {
        case y.STRING:
            return t;
        case y.BYTES:
            {
                let n = Se(t);
                if (n === !1) throw Error(`cannot parse ${y[e]} default value: ${t}`);
                return n
            }
        case y.INT64:
        case y.SFIXED64:
        case y.SINT64:
            return v.parse(t);
        case y.UINT64:
        case y.FIXED64:
            return v.uParse(t);
        case y.DOUBLE:
        case y.FLOAT:
            switch (t) {
                case `inf`:
                    return 1 / 0;
                case `-inf`:
                    return -1 / 0;
                case `nan`:
                    return NaN;
                default:
                    return parseFloat(t)
            }
        case y.BOOL:
            return t === `true`;
        case y.INT32:
        case y.UINT32:
        case y.SINT32:
        case y.FIXED32:
        case y.SFIXED32:
            return parseInt(t, 10)
    }
}

function Se(e) {
    let t = [],
        n = {
            tail: e,
            c: ``,
            next() {
                return this.tail.length == 0 ? !1 : (this.c = this.tail[0], this.tail = this.tail.substring(1), !0)
            },
            take(e) {
                if (this.tail.length >= e) {
                    let t = this.tail.substring(0, e);
                    return this.tail = this.tail.substring(e), t
                }
                return !1
            }
        };
    for (; n.next();) switch (n.c) {
        case `\\`:
            if (n.next()) switch (n.c) {
                case `\\`:
                    t.push(n.c.charCodeAt(0));
                    break;
                case `b`:
                    t.push(8);
                    break;
                case `f`:
                    t.push(12);
                    break;
                case `n`:
                    t.push(10);
                    break;
                case `r`:
                    t.push(13);
                    break;
                case `t`:
                    t.push(9);
                    break;
                case `v`:
                    t.push(11);
                    break;
                case `0`:
                case `1`:
                case `2`:
                case `3`:
                case `4`:
                case `5`:
                case `6`:
                case `7`:
                    {
                        let e = n.c,
                            r = n.take(2);
                        if (r === !1) return !1;
                        let i = parseInt(e + r, 8);
                        if (Number.isNaN(i)) return !1;t.push(i);
                        break
                    }
                case `x`:
                    {
                        let e = n.c,
                            r = n.take(2);
                        if (r === !1) return !1;
                        let i = parseInt(e + r, 16);
                        if (Number.isNaN(i)) return !1;t.push(i);
                        break
                    }
                case `u`:
                    {
                        let e = n.c,
                            r = n.take(4);
                        if (r === !1) return !1;
                        let i = parseInt(e + r, 16);
                        if (Number.isNaN(i)) return !1;
                        let a = new Uint8Array(4);new DataView(a.buffer).setInt32(0, i, !0),
                        t.push(a[0], a[1], a[2], a[3]);
                        break
                    }
                case `U`:
                    {
                        let e = n.c,
                            r = n.take(8);
                        if (r === !1) return !1;
                        let i = v.uEnc(e + r),
                            a = new Uint8Array(8),
                            o = new DataView(a.buffer);o.setInt32(0, i.lo, !0),
                        o.setInt32(4, i.hi, !0),
                        t.push(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7]);
                        break
                    }
            }
            break;
        default:
            t.push(n.c.charCodeAt(0))
    }
    return new Uint8Array(t)
}

function* Ce(e) {
    switch (e.kind) {
        case `file`:
            for (let t of e.messages) yield t, yield* Ce(t);
            yield* e.enums, yield* e.services, yield* e.extensions;
            break;
        case `message`:
            for (let t of e.nestedMessages) yield t, yield* Ce(t);
            yield* e.nestedEnums, yield* e.nestedExtensions;
            break
    }
}

function we(...e) {
    let t = Te();
    if (!e.length) return t;
    if (`$typeName` in e[0] && e[0].$typeName == `google.protobuf.FileDescriptorSet`) {
        for (let n of e[0].file) qe(n, t);
        return t
    }
    if (`$typeName` in e[0]) {
        let n = e[0],
            r = e[1],
            i = new Set;

        function a(e) {
            let n = [];
            for (let a of e.dependency) {
                if (t.getFile(a) != null || i.has(a)) continue;
                let o = r(a);
                if (!o) throw Error(`Unable to resolve ${a}, imported by ${e.name}`);
                `kind` in o ? t.addFile(o, !1, !0) : (i.add(o.name), n.push(o))
            }
            return n.concat(...n.map(a))
        }
        for (let e of [n, ...a(n)].reverse()) qe(e, t)
    } else
        for (let n of e)
            for (let e of n.files) t.addFile(e);
    return t
}

function Te() {
    let e = new Map,
        t = new Map,
        n = new Map;
    return {
        kind: `registry`,
        types: e,
        extendees: t,
        [Symbol.iterator]() {
            return e.values()
        },
        get files() {
            return n.values()
        },
        addFile(e, t, r) {
            if (n.set(e.proto.name, e), !t)
                for (let t of Ce(e)) this.add(t);
            if (r)
                for (let n of e.dependencies) this.addFile(n, t, r)
        },
        add(n) {
            if (n.kind == `extension`) {
                let e = t.get(n.extendee.typeName);
                e || t.set(n.extendee.typeName, e = new Map), e.set(n.number, n)
            }
            e.set(n.typeName, n)
        },
        get(t) {
            return e.get(t)
        },
        getFile(e) {
            return n.get(e)
        },
        getMessage(t) {
            let n = e.get(t);
            return n ? .kind == `message` ? n : void 0
        },
        getEnum(t) {
            let n = e.get(t);
            return n ? .kind == `enum` ? n : void 0
        },
        getExtension(t) {
            let n = e.get(t);
            return n ? .kind == `extension` ? n : void 0
        },
        getExtensionFor(e, n) {
            return t.get(e.typeName) ? .get(n)
        },
        getService(t) {
            let n = e.get(t);
            return n ? .kind == `service` ? n : void 0
        }
    }
}
var Ee = 998,
    De = 999,
    Oe = 9999,
    ke = 9,
    Ae = 10,
    je = 11,
    Me = 12,
    Ne = 14,
    Pe = 3,
    Fe = 2,
    Ie = 1,
    Le = 0,
    Re = 1,
    ze = 2,
    Be = 3,
    Ve = 1,
    He = 2,
    Ue = 1,
    We = 2,
    Ge = 1001,
    Ke = {
        998: {
            fieldPresence: 1,
            enumType: 2,
            repeatedFieldEncoding: 2,
            utf8Validation: 3,
            messageEncoding: 1,
            jsonFormat: 2,
            enforceNamingStyle: 2,
            defaultSymbolVisibility: 1
        },
        999: {
            fieldPresence: 2,
            enumType: 1,
            repeatedFieldEncoding: 1,
            utf8Validation: 2,
            messageEncoding: 1,
            jsonFormat: 1,
            enforceNamingStyle: 2,
            defaultSymbolVisibility: 1
        },
        1e3: {
            fieldPresence: 1,
            enumType: 1,
            repeatedFieldEncoding: 1,
            utf8Validation: 2,
            messageEncoding: 1,
            jsonFormat: 1,
            enforceNamingStyle: 2,
            defaultSymbolVisibility: 1
        },
        1001: {
            fieldPresence: 1,
            enumType: 1,
            repeatedFieldEncoding: 1,
            utf8Validation: 2,
            messageEncoding: 1,
            jsonFormat: 1,
            enforceNamingStyle: 1,
            defaultSymbolVisibility: 2
        }
    };

function qe(e, t) {
    let n = {
            kind: `file`,
            proto: e,
            deprecated: e.options ? .deprecated ? ? !1,
            edition: nt(e),
            name: e.name.replace(/\.proto$/, ``),
            dependencies: rt(e, t),
            enums: [],
            messages: [],
            extensions: [],
            services: [],
            toString() {
                return `file ${e.name}`
            }
        },
        r = new Map,
        i = {
            get(e) {
                return r.get(e)
            },
            add(e) {
                w(e.proto.options ? .mapEntry === !0), r.set(e.typeName, e)
            }
        };
    for (let r of e.enumType) Xe(r, n, void 0, t);
    for (let r of e.messageType) Ze(r, n, void 0, t, i);
    for (let r of e.service) Qe(r, n, t);
    Je(n, t);
    for (let e of r.values()) Ye(e, t, i);
    for (let e of n.messages) Ye(e, t, i), Je(e, t);
    t.addFile(n, !0)
}

function Je(e, t) {
    switch (e.kind) {
        case `file`:
            for (let n of e.proto.extension) {
                let r = tt(n, e, t);
                e.extensions.push(r), t.add(r)
            }
            break;
        case `message`:
            for (let n of e.proto.extension) {
                let r = tt(n, e, t);
                e.nestedExtensions.push(r), t.add(r)
            }
            for (let n of e.nestedMessages) Je(n, t);
            break
    }
}

function Ye(e, t, n) {
    let r = e.proto.oneofDecl.map(t => et(t, e)),
        i = new Set;
    for (let a of e.proto.field) {
        let o = st(a, r),
            s = tt(a, e, t, o, n);
        e.fields.push(s), e.field[s.localName] = s, o === void 0 ? e.members.push(s) : (o.fields.push(s), i.has(o) || (i.add(o), e.members.push(o)))
    }
    for (let t of r.filter(e => i.has(e))) e.oneofs.push(t);
    for (let r of e.nestedMessages) Ye(r, t, n)
}

function Xe(e, t, n, r) {
    let i = it(e.name, e.value),
        a = {
            kind: `enum`,
            proto: e,
            deprecated: e.options ? .deprecated ? ? !1,
            file: t,
            parent: n,
            open: !0,
            name: e.name,
            typeName: ot(e, n, t),
            value: {},
            values: [],
            sharedPrefix: i,
            toString() {
                return `enum ${this.typeName}`
            }
        };
    a.open = dt(a), r.add(a);
    for (let t of e.value) {
        let e = t.name;
        a.values.push(a.value[t.number] = {
            kind: `enum_value`,
            proto: t,
            deprecated: t.options ? .deprecated ? ? !1,
            parent: a,
            name: e,
            localName: p(i == null ? e : e.substring(i.length)),
            number: t.number,
            toString() {
                return `enum value ${a.typeName}.${e}`
            }
        })
    }(n ? .nestedEnums ? ? t.enums).push(a)
}

function Ze(e, t, n, r, i) {
    let a = {
        kind: `message`,
        proto: e,
        deprecated: e.options ? .deprecated ? ? !1,
        file: t,
        parent: n,
        name: e.name,
        typeName: ot(e, n, t),
        fields: [],
        field: {},
        oneofs: [],
        members: [],
        nestedEnums: [],
        nestedMessages: [],
        nestedExtensions: [],
        toString() {
            return `message ${this.typeName}`
        }
    };
    e.options ? .mapEntry === !0 ? i.add(a) : ((n ? .nestedMessages ? ? t.messages).push(a), r.add(a));
    for (let n of e.enumType) Xe(n, t, a, r);
    for (let n of e.nestedType) Ze(n, t, a, r, i)
}

function Qe(e, t, n) {
    let r = {
        kind: `service`,
        proto: e,
        deprecated: e.options ? .deprecated ? ? !1,
        file: t,
        name: e.name,
        typeName: ot(e, void 0, t),
        methods: [],
        method: {},
        toString() {
            return `service ${this.typeName}`
        }
    };
    t.services.push(r), n.add(r);
    for (let t of e.method) {
        let e = $e(t, r, n);
        r.methods.push(e), r.method[e.localName] = e
    }
}

function $e(e, t, n) {
    let r;
    r = e.clientStreaming && e.serverStreaming ? `bidi_streaming` : e.clientStreaming ? `client_streaming` : e.serverStreaming ? `server_streaming` : `unary`;
    let i = n.getMessage(S(e.inputType)),
        a = n.getMessage(S(e.outputType));
    w(i, `invalid MethodDescriptorProto: input_type ${e.inputType} not found`), w(a, `invalid MethodDescriptorProto: output_type ${e.inputType} not found`);
    let o = e.name;
    return {
        kind: `rpc`,
        proto: e,
        deprecated: e.options ? .deprecated ? ? !1,
        parent: t,
        name: o,
        localName: p(o.length ? p(o[0].toLowerCase() + o.substring(1)) : o),
        methodKind: r,
        input: i,
        output: a,
        idempotency: e.options ? .idempotencyLevel ? ? Le,
        toString() {
            return `rpc ${t.typeName}.${o}`
        }
    }
}

function et(e, t) {
    return {
        kind: `oneof`,
        proto: e,
        deprecated: !1,
        parent: t,
        fields: [],
        name: e.name,
        localName: p(u(e.name)),
        toString() {
            return `oneof ${t.typeName}.${this.name}`
        }
    }
}

function tt(e, t, n, r, i) {
    let a = i === void 0,
        o = {
            kind: `field`,
            proto: e,
            deprecated: e.options ? .deprecated ? ? !1,
            name: e.name,
            number: e.number,
            scalar: void 0,
            message: void 0,
            enum: void 0,
            presence: ct(e, r, a, t),
            utf8Validation: pt(e, t),
            listKind: void 0,
            mapKind: void 0,
            mapKey: void 0,
            delimitedEncoding: void 0,
            packed: void 0,
            longAsString: !1,
            getDefaultValue: void 0
        };
    if (a) {
        let r = t.kind == `file` ? t : t.file,
            i = t.kind == `file` ? void 0 : t,
            a = ot(e, i, r);
        o.kind = `extension`, o.file = r, o.parent = i, o.oneof = void 0, o.typeName = a, o.jsonName = `[${a}]`, o.toString = () => `extension ${a}`;
        let s = n.getMessage(S(e.extendee));
        w(s, `invalid FieldDescriptorProto: extendee ${e.extendee} not found`), o.extendee = s
    } else {
        let n = t;
        w(n.kind == `message`), o.parent = n, o.oneof = r, o.localName = r ? u(e.name) : p(u(e.name)), o.jsonName = e.jsonName, o.toString = () => `field ${n.typeName}.${e.name}`
    }
    let s = e.label,
        c = e.type,
        l = e.options ? .jstype;
    if (s === Pe) {
        let r = c == je ? i ? .get(S(e.typeName)) : void 0;
        if (r) {
            o.fieldKind = `map`;
            let {
                key: e,
                value: t
            } = ut(r);
            return o.mapKey = e.scalar, o.mapKind = t.fieldKind, o.message = t.message, o.delimitedEncoding = !1, o.enum = t.enum, o.scalar = t.scalar, o
        }
        switch (o.fieldKind = `list`, c) {
            case je:
            case Ae:
                o.listKind = `message`, o.message = n.getMessage(S(e.typeName)), w(o.message), o.delimitedEncoding = ft(e, t);
                break;
            case Ne:
                o.listKind = `enum`, o.enum = n.getEnum(S(e.typeName)), w(o.enum);
                break;
            default:
                o.listKind = `scalar`, o.scalar = c, o.longAsString = l == Ie;
                break
        }
        return o.packed = lt(e, t), o
    }
    switch (c) {
        case je:
        case Ae:
            o.fieldKind = `message`, o.message = n.getMessage(S(e.typeName)), w(o.message, `invalid FieldDescriptorProto: type_name ${e.typeName} not found`), o.delimitedEncoding = ft(e, t), o.getDefaultValue = () => void 0;
            break;
        case Ne:
            {
                let t = n.getEnum(S(e.typeName));w(t !== void 0, `invalid FieldDescriptorProto: type_name ${e.typeName} not found`),
                o.fieldKind = `enum`,
                o.enum = n.getEnum(S(e.typeName)),
                o.getDefaultValue = () => he(e, `defaultValue`) ? be(t, e.defaultValue) : void 0;
                break
            }
        default:
            o.fieldKind = `scalar`, o.scalar = c, o.longAsString = l == Ie, o.getDefaultValue = () => he(e, `defaultValue`) ? xe(c, e.defaultValue) : void 0;
            break
    }
    return o
}

function nt(e) {
    switch (e.syntax) {
        case ``:
        case `proto2`:
            return Ee;
        case `proto3`:
            return De;
        case `editions`:
            if (e.edition === Oe) return Ge;
            if (e.edition in Ke) return e.edition;
            throw Error(`${e.name}: unsupported edition`);
        default:
            throw Error(`${e.name}: unsupported syntax "${e.syntax}"`)
    }
}

function rt(e, t) {
    return e.dependency.map(n => {
        let r = t.getFile(n);
        if (!r) throw Error(`Cannot find ${n}, imported by ${e.name}`);
        return r
    })
}

function it(e, t) {
    let n = at(e) + `_`;
    for (let e of t) {
        if (!e.name.toLowerCase().startsWith(n)) return;
        let t = e.name.substring(n.length);
        if (t.length == 0 || /^\d/.test(t)) return
    }
    return n
}

function at(e) {
    return (e.substring(0, 1) + e.substring(1).replace(/[A-Z]/g, e => `_` + e)).toLowerCase()
}

function ot(e, t, n) {
    let r;
    return r = t ? `${t.typeName}.${e.name}` : n.proto.package.length > 0 ? `${n.proto.package}.${e.name}` : `${e.name}`, r
}

function S(e) {
    return e.startsWith(`.`) ? e.substring(1) : e
}

function st(e, t) {
    if (!he(e, `oneofIndex`) || e.proto3Optional) return;
    let n = t[e.oneofIndex];
    return w(n, `invalid FieldDescriptorProto: oneof #${e.oneofIndex} for field #${e.number} not found`), n
}

function ct(e, t, n, r) {
    if (e.label == Fe) return Be;
    if (e.label == Pe) return ze;
    if (t || e.proto3Optional || n) return Re;
    let i = C(`fieldPresence`, {
        proto: e,
        parent: r
    });
    return i == ze && (e.type == je || e.type == Ae) ? Re : i
}

function lt(e, t) {
    if (e.label != Pe) return !1;
    switch (e.type) {
        case ke:
        case Me:
        case Ae:
        case je:
            return !1
    }
    let n = e.options;
    return n && he(n, `packed`) ? n.packed : Ve == C(`repeatedFieldEncoding`, {
        proto: e,
        parent: t
    })
}

function ut(e) {
    let t = e.fields.find(e => e.number === 1),
        n = e.fields.find(e => e.number === 2);
    return w(t && t.fieldKind == `scalar` && t.scalar != y.BYTES && t.scalar != y.FLOAT && t.scalar != y.DOUBLE && n && n.fieldKind != `list` && n.fieldKind != `map`), {
        key: t,
        value: n
    }
}

function dt(e) {
    return Ue == C(`enumType`, {
        proto: e.proto,
        parent: e.parent ? ? e.file
    })
}

function ft(e, t) {
    return e.type == Ae ? !0 : He == C(`messageEncoding`, {
        proto: e,
        parent: t
    })
}

function pt(e, t) {
    return We == C(`utf8Validation`, {
        proto: e,
        parent: t
    })
}

function C(e, t) {
    let n = t.proto.options ? .features;
    if (n) {
        let t = n[e];
        if (t != 0) return t
    }
    if (`kind` in t) {
        if (t.kind == `message`) return C(e, t.parent ? ? t.file);
        let n = Ke[t.edition];
        if (!n) throw Error(`feature default for edition ${t.edition} not found`);
        return n[e]
    }
    return C(e, t.parent)
}

function w(e, t) {
    if (!e) throw Error(t)
}

function mt(e) {
    let t = ht(e);
    return t.messageType.forEach(ye), we(t, () => void 0).getFile(t.name)
}

function ht(e) {
    return Object.assign(Object.create({
        syntax: ``,
        edition: 0
    }), Object.assign(Object.assign({
        $typeName: `google.protobuf.FileDescriptorProto`,
        dependency: [],
        publicDependency: [],
        weakDependency: [],
        optionDependency: [],
        service: [],
        extension: []
    }, e), {
        messageType: e.messageType.map(gt),
        enumType: e.enumType.map(yt)
    }))
}

function gt(e) {
    return Object.assign(Object.create({
        visibility: 0
    }), {
        $typeName: `google.protobuf.DescriptorProto`,
        name: e.name,
        field: e.field ? .map(_t) ? ? [],
        extension: [],
        nestedType: e.nestedType ? .map(gt) ? ? [],
        enumType: e.enumType ? .map(yt) ? ? [],
        extensionRange: e.extensionRange ? .map(e => Object.assign({
            $typeName: `google.protobuf.DescriptorProto.ExtensionRange`
        }, e)) ? ? [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: []
    })
}

function _t(e) {
    return Object.assign(Object.create({
        label: 1,
        typeName: ``,
        extendee: ``,
        defaultValue: ``,
        oneofIndex: 0,
        jsonName: ``,
        proto3Optional: !1
    }), Object.assign(Object.assign({
        $typeName: `google.protobuf.FieldDescriptorProto`
    }, e), {
        options: e.options ? vt(e.options) : void 0
    }))
}

function vt(e) {
    return Object.assign(Object.create({
        ctype: 0,
        packed: !1,
        jstype: 0,
        lazy: !1,
        unverifiedLazy: !1,
        deprecated: !1,
        weak: !1,
        debugRedact: !1,
        retention: 0
    }), Object.assign(Object.assign({
        $typeName: `google.protobuf.FieldOptions`
    }, e), {
        targets: e.targets ? ? [],
        editionDefaults: e.editionDefaults ? .map(e => Object.assign({
            $typeName: `google.protobuf.FieldOptions.EditionDefault`
        }, e)) ? ? [],
        uninterpretedOption: []
    }))
}

function yt(e) {
    return Object.assign(Object.create({
        visibility: 0
    }), {
        $typeName: `google.protobuf.EnumDescriptorProto`,
        name: e.name,
        reservedName: [],
        reservedRange: [],
        value: e.value.map(e => Object.assign({
            $typeName: `google.protobuf.EnumValueDescriptorProto`
        }, e))
    })
}

function bt(e) {
    let t = Tt(),
        n = e.length * 3 / 4;
    e[e.length - 2] == `=` ? n -= 2 : e[e.length - 1] == `=` && --n;
    let r = new Uint8Array(n),
        i = 0,
        a = 0,
        o, s = 0;
    for (let n = 0; n < e.length; n++) {
        if (o = t[e.charCodeAt(n)], o === void 0) switch (e[n]) {
            case `=`:
                a = 0;
            case `
`:
            case `\r`:
            case `	`:
            case ` `:
                continue;
            default:
                throw Error(`invalid base64 string`)
        }
        switch (a) {
            case 0:
                s = o, a = 1;
                break;
            case 1:
                r[i++] = s << 2 | (o & 48) >> 4, s = o, a = 2;
                break;
            case 2:
                r[i++] = (s & 15) << 4 | (o & 60) >> 2, s = o, a = 3;
                break;
            case 3:
                r[i++] = (s & 3) << 6 | o, a = 0;
                break
        }
    }
    if (a == 1) throw Error(`invalid base64 string`);
    return r.subarray(0, i)
}

function xt(e, t = `std`) {
    let n = wt(t),
        r = t == `std`,
        i = ``,
        a = 0,
        o, s = 0;
    for (let t = 0; t < e.length; t++) switch (o = e[t], a) {
        case 0:
            i += n[o >> 2], s = (o & 3) << 4, a = 1;
            break;
        case 1:
            i += n[s | o >> 4], s = (o & 15) << 2, a = 2;
            break;
        case 2:
            i += n[s | o >> 6], i += n[o & 63], a = 0;
            break
    }
    return a && (i += n[s], r && (i += `=`, a == 1 && (i += `=`))), i
}
var St, Ct, T;

function wt(e) {
    return St || (St = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`.split(``), Ct = St.slice(0, -2).concat(`-`, `_`)), e == `url` ? Ct : St
}

function Tt() {
    if (!T) {
        T = [];
        let e = wt(`std`);
        for (let t = 0; t < e.length; t++) T[e[t].charCodeAt(0)] = t;
        T[45] = e.indexOf(`+`), T[95] = e.indexOf(`/`)
    }
    return T
}

function Et(e, t) {
    return typeof e == `object` && e && `$typeName` in e && typeof e.$typeName == `string` ? t === void 0 ? !0 : t.typeName === e.$typeName : !1
}
var Dt = [`FieldValueInvalidError`, `FieldListRangeError`, `ForeignFieldError`],
    E = class extends Error {
        constructor(e, t, n = `FieldValueInvalidError`) {
            super(t), this.name = n, this.field = () => e
        }
    };

function Ot(e) {
    return e instanceof Error && Dt.includes(e.name) && `field` in e && typeof e.field == `function`
}

function D(e) {
    return typeof e == `object` && !!e && !Array.isArray(e)
}

function kt(e, t) {
    if (D(e) && x in e && `add` in e && `field` in e && typeof e.field == `function`) {
        if (t !== void 0) {
            let n = t,
                r = e.field();
            return n.listKind == r.listKind && n.scalar === r.scalar && n.message ? .typeName === r.message ? .typeName && n.enum ? .typeName === r.enum ? .typeName
        }
        return !0
    }
    return !1
}

function At(e, t) {
    if (D(e) && x in e && `has` in e && `field` in e && typeof e.field == `function`) {
        if (t !== void 0) {
            let n = t,
                r = e.field();
            return n.mapKey === r.mapKey && n.mapKind == r.mapKind && n.scalar === r.scalar && n.message ? .typeName === r.message ? .typeName && n.enum ? .typeName === r.enum ? .typeName
        }
        return !0
    }
    return !1
}

function jt(e, t) {
    return D(e) && x in e && `desc` in e && D(e.desc) && e.desc.kind === `message` && (t === void 0 || e.desc.typeName == t.typeName)
}
var Mt = Symbol.for(`@bufbuild/protobuf/text-encoding`);

function Nt() {
    if (globalThis[Mt] == null) {
        let e = new globalThis.TextEncoder,
            t = new globalThis.TextDecoder,
            n;
        globalThis[Mt] = {
            encodeUtf8(t) {
                return e.encode(t)
            },
            decodeUtf8(e, r) {
                return r ? (n === void 0 && (n = new globalThis.TextDecoder(`utf-8`, {
                    fatal: !0
                })), n.decode(e)) : t.decode(e)
            },
            checkUtf8(e) {
                try {
                    return !0
                } catch {
                    return !1
                }
            }
        }
    }
    return globalThis[Mt]
}
var O;
(function(e) {
    e[e.Varint = 0] = `Varint`, e[e.Bit64 = 1] = `Bit64`, e[e.LengthDelimited = 2] = `LengthDelimited`, e[e.StartGroup = 3] = `StartGroup`, e[e.EndGroup = 4] = `EndGroup`, e[e.Bit32 = 5] = `Bit32`
})(O || = {});
var Pt = class {
        constructor(e = Nt().encodeUtf8) {
            this.encodeUtf8 = e, this.stack = [], this.chunks = [], this.buf = []
        }
        finish() {
            this.buf.length && (this.chunks.push(new Uint8Array(this.buf)), this.buf = []);
            let e = 0;
            for (let t = 0; t < this.chunks.length; t++) e += this.chunks[t].length;
            let t = new Uint8Array(e),
                n = 0;
            for (let e = 0; e < this.chunks.length; e++) t.set(this.chunks[e], n), n += this.chunks[e].length;
            return this.chunks = [], t
        }
        fork() {
            return this.stack.push({
                chunks: this.chunks,
                buf: this.buf
            }), this.chunks = [], this.buf = [], this
        }
        join() {
            let e = this.finish(),
                t = this.stack.pop();
            if (!t) throw Error(`invalid state, fork stack empty`);
            return this.chunks = t.chunks, this.buf = t.buf, this.uint32(e.byteLength), this.raw(e)
        }
        tag(e, t) {
            return this.uint32((e << 3 | t) >>> 0)
        }
        raw(e) {
            return this.buf.length && (this.chunks.push(new Uint8Array(this.buf)), this.buf = []), this.chunks.push(e), this
        }
        uint32(e) {
            for (Lt(e); e > 127;) this.buf.push(e & 127 | 128), e >>>= 7;
            return this.buf.push(e), this
        }
        int32(e) {
            return It(e), oe(e, this.buf), this
        }
        bool(e) {
            return this.buf.push(+!!e), this
        }
        bytes(e) {
            return this.uint32(e.byteLength), this.raw(e)
        }
        string(e) {
            let t = this.encodeUtf8(e);
            return this.uint32(t.byteLength), this.raw(t)
        }
        float(e) {
            Rt(e);
            let t = new Uint8Array(4);
            return new DataView(t.buffer).setFloat32(0, e, !0), this.raw(t)
        }
        double(e) {
            let t = new Uint8Array(8);
            return new DataView(t.buffer).setFloat64(0, e, !0), this.raw(t)
        }
        fixed32(e) {
            Lt(e);
            let t = new Uint8Array(4);
            return new DataView(t.buffer).setUint32(0, e, !0), this.raw(t)
        }
        sfixed32(e) {
            It(e);
            let t = new Uint8Array(4);
            return new DataView(t.buffer).setInt32(0, e, !0), this.raw(t)
        }
        sint32(e) {
            return It(e), e = (e << 1 ^ e >> 31) >>> 0, oe(e, this.buf), this
        }
        sfixed64(e) {
            let t = new Uint8Array(8),
                n = new DataView(t.buffer),
                r = v.enc(e);
            return n.setInt32(0, r.lo, !0), n.setInt32(4, r.hi, !0), this.raw(t)
        }
        fixed64(e) {
            let t = new Uint8Array(8),
                n = new DataView(t.buffer),
                r = v.uEnc(e);
            return n.setInt32(0, r.lo, !0), n.setInt32(4, r.hi, !0), this.raw(t)
        }
        int64(e) {
            let t = v.enc(e);
            return h(t.lo, t.hi, this.buf), this
        }
        sint64(e) {
            let t = v.enc(e),
                n = t.hi >> 31;
            return h(t.lo << 1 ^ n, (t.hi << 1 | t.lo >>> 31) ^ n, this.buf), this
        }
        uint64(e) {
            let t = v.uEnc(e);
            return h(t.lo, t.hi, this.buf), this
        }
    },
    Ft = class {
        constructor(e, t = Nt().decodeUtf8) {
            this.decodeUtf8 = t, this.varint64 = m, this.uint32 = se, this.buf = e, this.len = e.length, this.pos = 0, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength)
        }
        tag() {
            let e = this.pos,
                t = this.uint32(),
                n = this.pos - e;
            if (n > 5 || n == 5 && this.buf[this.pos - 1] > 15) throw Error(`illegal tag: varint overflows uint32`);
            let r = t >>> 3,
                i = t & 7;
            if (r <= 0 || i > 5) throw Error(`illegal tag: field no ` + r + ` wire type ` + i);
            return [r, i]
        }
        skip(e, t) {
            let n = this.pos;
            switch (e) {
                case O.Varint:
                    for (; this.buf[this.pos++] & 128;);
                    break;
                case O.Bit64:
                    this.pos += 4;
                case O.Bit32:
                    this.pos += 4;
                    break;
                case O.LengthDelimited:
                    let n = this.uint32();
                    this.pos += n;
                    break;
                case O.StartGroup:
                    for (;;) {
                        let [e, n] = this.tag();
                        if (n === O.EndGroup) {
                            if (t !== void 0 && e !== t) throw Error(`invalid end group tag`);
                            break
                        }
                        this.skip(n, e)
                    }
                    break;
                default:
                    throw Error(`cant skip wire type ` + e)
            }
            return this.assertBounds(), this.buf.subarray(n, this.pos)
        }
        assertBounds() {
            if (this.pos > this.len) throw RangeError(`premature EOF`)
        }
        int32() {
            return this.uint32() | 0
        }
        sint32() {
            let e = this.uint32();
            return e >>> 1 ^ -(e & 1)
        }
        int64() {
            return v.dec(...this.varint64())
        }
        uint64() {
            return v.uDec(...this.varint64())
        }
        sint64() {
            let [e, t] = this.varint64(), n = -(e & 1);
            return e = (e >>> 1 | (t & 1) << 31) ^ n, t = t >>> 1 ^ n, v.dec(e, t)
        }
        bool() {
            let [e, t] = this.varint64();
            return e !== 0 || t !== 0
        }
        fixed32() {
            return this.view.getUint32((this.pos += 4) - 4, !0)
        }
        sfixed32() {
            return this.view.getInt32((this.pos += 4) - 4, !0)
        }
        fixed64() {
            return v.uDec(this.sfixed32(), this.sfixed32())
        }
        sfixed64() {
            return v.dec(this.sfixed32(), this.sfixed32())
        }
        float() {
            return this.view.getFloat32((this.pos += 4) - 4, !0)
        }
        double() {
            return this.view.getFloat64((this.pos += 8) - 8, !0)
        }
        bytes() {
            let e = this.uint32(),
                t = this.pos;
            return this.pos += e, this.assertBounds(), this.buf.subarray(t, t + e)
        }
        string(e) {
            return this.decodeUtf8(this.bytes(), e)
        }
    };

function It(e) {
    if (typeof e == `string`) e = Number(e);
    else if (typeof e != `number`) throw Error(`invalid int32: ` + typeof e);
    if (!Number.isInteger(e) || e > 2147483647 || e < -2147483648) throw Error(`invalid int32: ` + e)
}

function Lt(e) {
    if (typeof e == `string`) e = Number(e);
    else if (typeof e != `number`) throw Error(`invalid uint32: ` + typeof e);
    if (!Number.isInteger(e) || e > 4294967295 || e < 0) throw Error(`invalid uint32: ` + e)
}

function Rt(e) {
    if (typeof e == `string`) {
        let t = e;
        if (e = Number(e), Number.isNaN(e) && t !== `NaN`) throw Error(`invalid float32: ` + t)
    } else if (typeof e != `number`) throw Error(`invalid float32: ` + typeof e);
    if (Number.isFinite(e) && (e > 34028234663852886e22 || e < -34028234663852886e22)) throw Error(`invalid float32: ` + e)
}

function k(e, t) {
    let n = e.fieldKind == `list` ? kt(t, e) : e.fieldKind == `map` ? At(t, e) : Vt(e, t);
    if (n === !0) return;
    let r;
    switch (e.fieldKind) {
        case `list`:
            r = `expected ${Gt(e)}, got ${A(t)}`;
            break;
        case `map`:
            r = `expected ${Kt(e)}, got ${A(t)}`;
            break;
        default:
            r = Ut(e, t, n)
    }
    return new E(e, r)
}

function zt(e, t, n) {
    let r = Vt(e, n);
    if (r !== !0) return new E(e, `list item #${t+1}: ${Ut(e,n,r)}`)
}

function Bt(e, t, n) {
    let r = Ht(t, e.mapKey);
    if (r !== !0) return new E(e, `invalid map key: ${Ut({scalar:e.mapKey},t,r)}`);
    let i = Vt(e, n);
    if (i !== !0) return new E(e, `map entry ${A(t)}: ${Ut(e,n,i)}`)
}

function Vt(e, t) {
    return e.scalar === void 0 ? e.enum === void 0 ? jt(t, e.message) : e.enum.open ? Number.isInteger(t) : e.enum.values.some(e => e.number === t) : Ht(t, e.scalar)
}

function Ht(e, t) {
    switch (t) {
        case y.DOUBLE:
            return typeof e == `number`;
        case y.FLOAT:
            return typeof e == `number` ? Number.isNaN(e) || !Number.isFinite(e) ? !0 : e > 34028234663852886e22 || e < -34028234663852886e22 ? `${e.toFixed()} out of range` : !0 : !1;
        case y.INT32:
        case y.SFIXED32:
        case y.SINT32:
            return typeof e != `number` || !Number.isInteger(e) ? !1 : e > 2147483647 || e < -2147483648 ? `${e.toFixed()} out of range` : !0;
        case y.FIXED32:
        case y.UINT32:
            return typeof e != `number` || !Number.isInteger(e) ? !1 : e > 4294967295 || e < 0 ? `${e.toFixed()} out of range` : !0;
        case y.BOOL:
            return typeof e == `boolean`;
        case y.STRING:
            return typeof e == `string` ? Nt().checkUtf8(e) || `invalid UTF8` : !1;
        case y.BYTES:
            return e instanceof Uint8Array;
        case y.INT64:
        case y.SFIXED64:
        case y.SINT64:
            if (typeof e == `bigint` || typeof e == `number` || typeof e == `string` && e.length > 0) try {
                return v.parse(e), !0
            } catch {
                return `${e} out of range`
            }
            return !1;
        case y.FIXED64:
        case y.UINT64:
            if (typeof e == `bigint` || typeof e == `number` || typeof e == `string` && e.length > 0) try {
                return v.uParse(e), !0
            } catch {
                return `${e} out of range`
            }
            return !1
    }
}

function Ut(e, t, n) {
    return n = typeof n == `string` ? `: ${n}` : `, got ${A(t)}`, e.scalar === void 0 ? e.enum === void 0 ? `expected ${Wt(e.message)}` + n : `expected ${e.enum.toString()}` + n : `expected ${qt(e.scalar)}` + n
}

function A(e) {
    switch (typeof e) {
        case `object`:
            return e === null ? `null` : e instanceof Uint8Array ? `Uint8Array(${e.length})` : Array.isArray(e) ? `Array(${e.length})` : kt(e) ? Gt(e.field()) : At(e) ? Kt(e.field()) : jt(e) ? Wt(e.desc) : Et(e) ? `message ${e.$typeName}` : `object`;
        case `string`:
            return e.length > 30 ? `string` : `"${e.split(`"`).join(`\\"`)}"`;
        case `boolean`:
            return String(e);
        case `number`:
            return String(e);
        case `bigint`:
            return String(e) + `n`;
        default:
            return typeof e
    }
}

function Wt(e) {
    return `ReflectMessage (${e.typeName})`
}

function Gt(e) {
    switch (e.listKind) {
        case `message`:
            return `ReflectList (${e.message.toString()})`;
        case `enum`:
            return `ReflectList (${e.enum.toString()})`;
        case `scalar`:
            return `ReflectList (${y[e.scalar]})`
    }
}

function Kt(e) {
    switch (e.mapKind) {
        case `message`:
            return `ReflectMap (${y[e.mapKey]}, ${e.message.toString()})`;
        case `enum`:
            return `ReflectMap (${y[e.mapKey]}, ${e.enum.toString()})`;
        case `scalar`:
            return `ReflectMap (${y[e.mapKey]}, ${y[e.scalar]})`
    }
}

function qt(e) {
    switch (e) {
        case y.STRING:
            return `string`;
        case y.BOOL:
            return `boolean`;
        case y.INT64:
        case y.SINT64:
        case y.SFIXED64:
            return `bigint (int64)`;
        case y.UINT64:
        case y.FIXED64:
            return `bigint (uint64)`;
        case y.BYTES:
            return `Uint8Array`;
        case y.DOUBLE:
            return `number (float64)`;
        case y.FLOAT:
            return `number (float32)`;
        case y.FIXED32:
        case y.UINT32:
            return `number (uint32)`;
        case y.INT32:
        case y.SFIXED32:
        case y.SINT32:
            return `number (int32)`
    }
}

function Jt(e) {
    return Xt(e.$typeName)
}

function j(e) {
    let t = e.fields[0];
    return Xt(e.typeName) && t !== void 0 && t.fieldKind == `scalar` && t.name == `value` && t.number == 1
}

function Yt(e) {
    switch (e.typeName) {
        case `google.protobuf.Any`:
        case `google.protobuf.Timestamp`:
        case `google.protobuf.Duration`:
        case `google.protobuf.FieldMask`:
        case `google.protobuf.Struct`:
        case `google.protobuf.Value`:
        case `google.protobuf.ListValue`:
            return !0;
        default:
            return j(e)
    }
}

function Xt(e) {
    return e.startsWith(`google.protobuf.`) && [`DoubleValue`, `FloatValue`, `Int64Value`, `UInt64Value`, `Int32Value`, `UInt32Value`, `BoolValue`, `StringValue`, `BytesValue`].includes(e.substring(16))
}
var Zt = 999,
    Qt = 998,
    $t = 2;

function M(e, t) {
    if (Et(t, e)) return t;
    let n = un(e);
    return t !== void 0 && en(e, n, t), n
}

function en(e, t, n) {
    for (let r of e.members) {
        let e = n[r.localName];
        if (e == null) continue;
        let i;
        if (r.kind == `oneof`) {
            let t = pe(n, r);
            if (!t) continue;
            i = t, e = ge(n, t)
        } else i = r;
        switch (i.fieldKind) {
            case `message`:
                e = an(i, e);
                break;
            case `scalar`:
                e = tn(i, e);
                break;
            case `list`:
                e = rn(i, e);
                break;
            case `map`:
                e = nn(i, e);
                break
        }
        _e(t, i, e)
    }
    return t
}

function tn(e, t) {
    return e.scalar == y.BYTES ? on(t) : t
}

function nn(e, t) {
    if (D(t)) {
        if (e.scalar == y.BYTES) return sn(t, on);
        if (e.mapKind == `message`) return sn(t, t => an(e, t))
    }
    return t
}

function rn(e, t) {
    if (Array.isArray(t)) {
        if (e.scalar == y.BYTES) return t.map(on);
        if (e.listKind == `message`) return t.map(t => an(e, t))
    }
    return t
}

function an(e, t) {
    if (e.fieldKind == `message` && !e.oneof && j(e.message)) return tn(e.message.fields[0], t);
    if (D(t)) {
        if (e.message.typeName == `google.protobuf.Struct` && e.parent.typeName !== `google.protobuf.Value`) return t;
        if (!Et(t, e.message)) return M(e.message, t)
    }
    return t
}

function on(e) {
    return Array.isArray(e) ? new Uint8Array(e) : e
}

function sn(e, t) {
    let n = {};
    for (let r of Object.entries(e)) n[r[0]] = t(r[1]);
    return n
}
var cn = Symbol(),
    ln = new WeakMap;

function un(e) {
    let t;
    if (dn(e)) {
        let n = ln.get(e),
            r, i;
        if (n)({
            prototype: r,
            members: i
        } = n);
        else {
            r = {}, i = new Set;
            for (let t of e.members) t.kind != `oneof` && (t.fieldKind != `scalar` && t.fieldKind != `enum` || t.presence != $t && (i.add(t), r[t.localName] = fn(t)));
            ln.set(e, {
                prototype: r,
                members: i
            })
        }
        t = Object.create(r), t.$typeName = e.typeName;
        for (let n of e.members) i.has(n) || n.kind == `field` && (n.fieldKind == `message` || (n.fieldKind == `scalar` || n.fieldKind == `enum`) && n.presence != $t) || (t[n.localName] = fn(n))
    } else {
        t = {
            $typeName: e.typeName
        };
        for (let n of e.members)(n.kind == `oneof` || n.presence == $t) && (t[n.localName] = fn(n))
    }
    return t
}

function dn(e) {
    switch (e.file.edition) {
        case Zt:
            return !1;
        case Qt:
            return !0;
        default:
            return e.fields.some(e => e.presence != $t && e.fieldKind != `message` && !e.oneof)
    }
}

function fn(e) {
    if (e.kind == `oneof`) return {
        case: void 0
    };
    if (e.fieldKind == `list`) return [];
    if (e.fieldKind == `map`) return {};
    if (e.fieldKind == `message`) return cn;
    let t = e.getDefaultValue();
    return t === void 0 ? e.fieldKind == `scalar` ? b(e.scalar, e.longAsString) : e.enum.values[0].number : e.fieldKind == `scalar` && e.longAsString ? t.toString() : t
}

function N(e, t, n = !0) {
    return new mn(e, t, n)
}
var pn = new WeakMap,
    mn = class {
        get sortedFields() {
            let e = pn.get(this.desc);
            if (e) return e;
            let t = this.desc.fields.concat().sort((e, t) => e.number - t.number);
            return pn.set(this.desc, t), t
        }
        constructor(e, t, n = !0) {
            this.lists = new Map, this.maps = new Map, this.check = n, this.desc = e, this.message = this[x] = t ? ? M(e), this.fields = e.fields, this.oneofs = e.oneofs, this.members = e.members
        }
        findNumber(e) {
            return this._fieldsByNumber || = new Map(this.desc.fields.map(e => [e.number, e])), this._fieldsByNumber.get(e)
        }
        oneofCase(e) {
            return hn(this.message, e), pe(this.message, e)
        }
        isSet(e) {
            return hn(this.message, e), me(this.message, e)
        }
        clear(e) {
            hn(this.message, e), ve(this.message, e)
        }
        get(e) {
            hn(this.message, e);
            let t = ge(this.message, e);
            switch (e.fieldKind) {
                case `list`:
                    let n = this.lists.get(e);
                    return (!n || n[x] !== t) && this.lists.set(e, n = new gn(e, t, this.check)), n;
                case `map`:
                    let r = this.maps.get(e);
                    return (!r || r[x] !== t) && this.maps.set(e, r = new _n(e, t, this.check)), r;
                case `message`:
                    return yn(e, t, this.check);
                case `scalar`:
                    return t === void 0 ? b(e.scalar, !1) : En(e, t);
                case `enum`:
                    return t ? ? e.enum.values[0].number
            }
        }
        set(e, t) {
            if (hn(this.message, e), this.check) {
                let n = k(e, t);
                if (n) throw n
            }
            let n;
            n = e.fieldKind == `message` ? vn(e, t) : At(t) || kt(t) ? t[x] : Dn(e, t), _e(this.message, e, n)
        }
        getUnknown() {
            return this.message.$unknown
        }
        setUnknown(e) {
            this.message.$unknown = e
        }
    };

function hn(e, t) {
    if (t.parent.typeName !== e.$typeName) throw new E(t, `cannot use ${t.toString()} with message ${e.$typeName}`, `ForeignFieldError`)
}
var gn = class {
        field() {
            return this._field
        }
        get size() {
            return this._arr.length
        }
        constructor(e, t, n) {
            this._field = e, this._arr = this[x] = t, this.check = n
        }
        get(e) {
            let t = this._arr[e];
            return t === void 0 ? void 0 : xn(this._field, t, this.check)
        }
        set(e, t) {
            if (e < 0 || e >= this._arr.length) throw new E(this._field, `list item #${e+1}: out of range`);
            if (this.check) {
                let n = zt(this._field, e, t);
                if (n) throw n
            }
            this._arr[e] = bn(this._field, t)
        }
        add(e) {
            if (this.check) {
                let t = zt(this._field, this._arr.length, e);
                if (t) throw t
            }
            this._arr.push(bn(this._field, e))
        }
        clear() {
            this._arr.splice(0, this._arr.length)
        }[Symbol.iterator]() {
            return this.values()
        }
        keys() {
            return this._arr.keys()
        }* values() {
            for (let e of this._arr) yield xn(this._field, e, this.check)
        }* entries() {
            for (let e = 0; e < this._arr.length; e++) yield [e, xn(this._field, this._arr[e], this.check)]
        }
    },
    _n = class {
        constructor(e, t, n = !0) {
            this.obj = this[x] = t ? ? {}, this.check = n, this._field = e
        }
        field() {
            return this._field
        }
        set(e, t) {
            if (this.check) {
                let n = Bt(this._field, e, t);
                if (n) throw n
            }
            return this.obj[wn(e)] = Sn(this._field, t), this
        }
        delete(e) {
            let t = wn(e),
                n = Object.prototype.hasOwnProperty.call(this.obj, t);
            return n && delete this.obj[t], n
        }
        clear() {
            for (let e of Object.keys(this.obj)) delete this.obj[e]
        }
        get(e) {
            let t = this.obj[wn(e)];
            return t !== void 0 && (t = Cn(this._field, t, this.check)), t
        }
        has(e) {
            return Object.prototype.hasOwnProperty.call(this.obj, wn(e))
        }* keys() {
            for (let e of Object.keys(this.obj)) yield Tn(e, this._field.mapKey)
        }* entries() {
            for (let e of Object.entries(this.obj)) yield [Tn(e[0], this._field.mapKey), Cn(this._field, e[1], this.check)]
        }[Symbol.iterator]() {
            return this.entries()
        }
        get size() {
            return Object.keys(this.obj).length
        }* values() {
            for (let e of Object.values(this.obj)) yield Cn(this._field, e, this.check)
        }
        forEach(e, t) {
            for (let n of this.entries()) e.call(t, n[1], n[0], this)
        }
    };

function vn(e, t) {
    return jt(t) ? Jt(t.message) && !e.oneof && e.fieldKind == `message` ? t.message.value : t.desc.typeName == `google.protobuf.Struct` && e.parent.typeName != `google.protobuf.Value` ? kn(t.message) : t.message : t
}

function yn(e, t, n) {
    return t !== void 0 && (j(e.message) && !e.oneof && e.fieldKind == `message` ? t = {
        $typeName: e.message.typeName,
        value: En(e.message.fields[0], t)
    } : e.message.typeName == `google.protobuf.Struct` && e.parent.typeName != `google.protobuf.Value` && D(t) && (t = On(t))), new mn(e.message, t, n)
}

function bn(e, t) {
    return e.listKind == `message` ? vn(e, t) : Dn(e, t)
}

function xn(e, t, n) {
    return e.listKind == `message` ? yn(e, t, n) : En(e, t)
}

function Sn(e, t) {
    return e.mapKind == `message` ? vn(e, t) : Dn(e, t)
}

function Cn(e, t, n) {
    return e.mapKind == `message` ? yn(e, t, n) : t
}

function wn(e) {
    return typeof e == `string` || typeof e == `number` ? e : String(e)
}

function Tn(e, t) {
    switch (t) {
        case y.STRING:
            return e;
        case y.INT32:
        case y.FIXED32:
        case y.UINT32:
        case y.SFIXED32:
        case y.SINT32:
            {
                let t = Number.parseInt(e);
                if (Number.isFinite(t)) return t;
                break
            }
        case y.BOOL:
            switch (e) {
                case `true`:
                    return !0;
                case `false`:
                    return !1
            }
            break;
        case y.UINT64:
        case y.FIXED64:
            try {
                return v.uParse(e)
            } catch {}
            break;
        default:
            try {
                return v.parse(e)
            } catch {}
            break
    }
    return e
}

function En(e, t) {
    switch (e.scalar) {
        case y.INT64:
        case y.SFIXED64:
        case y.SINT64:
            `longAsString` in e && e.longAsString && typeof t == `string` && (t = v.parse(t));
            break;
        case y.FIXED64:
        case y.UINT64:
            `longAsString` in e && e.longAsString && typeof t == `string` && (t = v.uParse(t));
            break
    }
    return t
}

function Dn(e, t) {
    switch (e.scalar) {
        case y.INT64:
        case y.SFIXED64:
        case y.SINT64:
            `longAsString` in e && e.longAsString ? t = String(t) : (typeof t == `string` || typeof t == `number`) && (t = v.parse(t));
            break;
        case y.FIXED64:
        case y.UINT64:
            `longAsString` in e && e.longAsString ? t = String(t) : (typeof t == `string` || typeof t == `number`) && (t = v.uParse(t));
            break
    }
    return t
}

function On(e) {
    let t = {
        $typeName: `google.protobuf.Struct`,
        fields: {}
    };
    if (D(e))
        for (let [n, r] of Object.entries(e)) t.fields[n] = jn(r);
    return t
}

function kn(e) {
    let t = {};
    for (let [n, r] of Object.entries(e.fields)) t[n] = An(r);
    return t
}

function An(e) {
    switch (e.kind.case) {
        case `structValue`:
            return kn(e.kind.value);
        case `listValue`:
            return e.kind.value.values.map(An);
        case `nullValue`:
        case void 0:
            return null;
        default:
            return e.kind.value
    }
}

function jn(e) {
    let t = {
        $typeName: `google.protobuf.Value`,
        kind: {
            case: void 0
        }
    };
    switch (typeof e) {
        case `number`:
            t.kind = {
                case: `numberValue`,
                value: e
            };
            break;
        case `string`:
            t.kind = {
                case: `stringValue`,
                value: e
            };
            break;
        case `boolean`:
            t.kind = {
                case: `boolValue`,
                value: e
            };
            break;
        case `object`:
            if (e === null) t.kind = {
                case: `nullValue`,
                value: 0
            };
            else if (Array.isArray(e)) {
                let n = {
                    $typeName: `google.protobuf.ListValue`,
                    values: []
                };
                if (Array.isArray(e))
                    for (let t of e) n.values.push(jn(t));
                t.kind = {
                    case: `listValue`,
                    value: n
                }
            } else t.kind = {
                case: `structValue`,
                value: On(e)
            };
            break
    }
    return t
}
var Mn = 3,
    Nn = {
        writeUnknownFields: !0
    };

function Pn(e) {
    return e ? Object.assign(Object.assign({}, Nn), e) : Nn
}

function Fn(e, t, n) {
    return In(new Pt, Pn(n), N(e, t)).finish()
}

function In(e, t, n) {
    for (let r of n.sortedFields) {
        if (!n.isSet(r)) {
            if (r.presence == Mn) throw Error(`cannot encode ${r} to binary: required field not set`);
            continue
        }
        Ln(e, t, n, r)
    }
    if (t.writeUnknownFields)
        for (let {
                no: t,
                wireType: r,
                data: i
            } of n.getUnknown() ? ? []) e.tag(t, r).raw(i);
    return e
}

function Ln(e, t, n, r) {
    switch (r.fieldKind) {
        case `scalar`:
        case `enum`:
            Rn(e, n.desc.typeName, r.name, r.scalar ? ? y.INT32, r.number, n.get(r));
            break;
        case `list`:
            Bn(e, t, r, n.get(r));
            break;
        case `message`:
            zn(e, t, r, n.get(r));
            break;
        case `map`:
            for (let [i, a] of n.get(r)) Vn(e, t, r, i, a);
            break
    }
}

function Rn(e, t, n, r, i, a) {
    Hn(e.tag(i, Un(r)), t, n, r, a)
}

function zn(e, t, n, r) {
    n.delimitedEncoding ? In(e.tag(n.number, O.StartGroup), t, r).tag(n.number, O.EndGroup) : In(e.tag(n.number, O.LengthDelimited).fork(), t, r).join()
}

function Bn(e, t, n, r) {
    if (n.listKind == `message`) {
        for (let i of r) zn(e, t, n, i);
        return
    }
    let i = n.scalar ? ? y.INT32;
    if (n.packed) {
        if (!r.size) return;
        e.tag(n.number, O.LengthDelimited).fork();
        for (let t of r) Hn(e, n.parent.typeName, n.name, i, t);
        e.join();
        return
    }
    for (let t of r) Rn(e, n.parent.typeName, n.name, i, n.number, t)
}

function Vn(e, t, n, r, i) {
    switch (e.tag(n.number, O.LengthDelimited).fork(), Rn(e, n.parent.typeName, n.name, n.mapKey, 1, r), n.mapKind) {
        case `scalar`:
        case `enum`:
            Rn(e, n.parent.typeName, n.name, n.scalar ? ? y.INT32, 2, i);
            break;
        case `message`:
            In(e.tag(2, O.LengthDelimited).fork(), t, i).join();
            break
    }
    e.join()
}

function Hn(e, t, n, r, i) {
    try {
        switch (r) {
            case y.STRING:
                e.string(i);
                break;
            case y.BOOL:
                e.bool(i);
                break;
            case y.DOUBLE:
                e.double(i);
                break;
            case y.FLOAT:
                e.float(i);
                break;
            case y.INT32:
                e.int32(i);
                break;
            case y.INT64:
                e.int64(i);
                break;
            case y.UINT64:
                e.uint64(i);
                break;
            case y.FIXED64:
                e.fixed64(i);
                break;
            case y.BYTES:
                e.bytes(i);
                break;
            case y.FIXED32:
                e.fixed32(i);
                break;
            case y.SFIXED32:
                e.sfixed32(i);
                break;
            case y.SFIXED64:
                e.sfixed64(i);
                break;
            case y.SINT64:
                e.sint64(i);
                break;
            case y.UINT32:
                e.uint32(i);
                break;
            case y.SINT32:
                e.sint32(i);
                break
        }
    } catch (e) {
        throw e instanceof Error ? Error(`cannot encode field ${t}.${n} to binary: ${e.message}`) : e
    }
}

function Un(e) {
    switch (e) {
        case y.BYTES:
        case y.STRING:
            return O.LengthDelimited;
        case y.DOUBLE:
        case y.FIXED64:
        case y.SFIXED64:
            return O.Bit64;
        case y.FIXED32:
        case y.SFIXED32:
        case y.FLOAT:
            return O.Bit32;
        default:
            return O.Varint
    }
}

function P(e, t, ...n) {
    return n.reduce((e, t) => e.nestedMessages[t], e.messages[t])
}
var Wn = mt({
        name: `google/protobuf/descriptor.proto`,
        package: `google.protobuf`,
        messageType: [{
            name: `FileDescriptorSet`,
            field: [{
                name: `file`,
                number: 1,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.FileDescriptorProto`
            }],
            extensionRange: [{
                start: 536e6,
                end: 536000001
            }]
        }, {
            name: `FileDescriptorProto`,
            field: [{
                name: `name`,
                number: 1,
                type: 9,
                label: 1
            }, {
                name: `package`,
                number: 2,
                type: 9,
                label: 1
            }, {
                name: `dependency`,
                number: 3,
                type: 9,
                label: 3
            }, {
                name: `public_dependency`,
                number: 10,
                type: 5,
                label: 3
            }, {
                name: `weak_dependency`,
                number: 11,
                type: 5,
                label: 3
            }, {
                name: `option_dependency`,
                number: 15,
                type: 9,
                label: 3
            }, {
                name: `message_type`,
                number: 4,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.DescriptorProto`
            }, {
                name: `enum_type`,
                number: 5,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.EnumDescriptorProto`
            }, {
                name: `service`,
                number: 6,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.ServiceDescriptorProto`
            }, {
                name: `extension`,
                number: 7,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.FieldDescriptorProto`
            }, {
                name: `options`,
                number: 8,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FileOptions`
            }, {
                name: `source_code_info`,
                number: 9,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.SourceCodeInfo`
            }, {
                name: `syntax`,
                number: 12,
                type: 9,
                label: 1
            }, {
                name: `edition`,
                number: 14,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.Edition`
            }]
        }, {
            name: `DescriptorProto`,
            field: [{
                name: `name`,
                number: 1,
                type: 9,
                label: 1
            }, {
                name: `field`,
                number: 2,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.FieldDescriptorProto`
            }, {
                name: `extension`,
                number: 6,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.FieldDescriptorProto`
            }, {
                name: `nested_type`,
                number: 3,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.DescriptorProto`
            }, {
                name: `enum_type`,
                number: 4,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.EnumDescriptorProto`
            }, {
                name: `extension_range`,
                number: 5,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.DescriptorProto.ExtensionRange`
            }, {
                name: `oneof_decl`,
                number: 8,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.OneofDescriptorProto`
            }, {
                name: `options`,
                number: 7,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.MessageOptions`
            }, {
                name: `reserved_range`,
                number: 9,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.DescriptorProto.ReservedRange`
            }, {
                name: `reserved_name`,
                number: 10,
                type: 9,
                label: 3
            }, {
                name: `visibility`,
                number: 11,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.SymbolVisibility`
            }],
            nestedType: [{
                name: `ExtensionRange`,
                field: [{
                    name: `start`,
                    number: 1,
                    type: 5,
                    label: 1
                }, {
                    name: `end`,
                    number: 2,
                    type: 5,
                    label: 1
                }, {
                    name: `options`,
                    number: 3,
                    type: 11,
                    label: 1,
                    typeName: `.google.protobuf.ExtensionRangeOptions`
                }]
            }, {
                name: `ReservedRange`,
                field: [{
                    name: `start`,
                    number: 1,
                    type: 5,
                    label: 1
                }, {
                    name: `end`,
                    number: 2,
                    type: 5,
                    label: 1
                }]
            }]
        }, {
            name: `ExtensionRangeOptions`,
            field: [{
                name: `uninterpreted_option`,
                number: 999,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.UninterpretedOption`
            }, {
                name: `declaration`,
                number: 2,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.ExtensionRangeOptions.Declaration`,
                options: {
                    retention: 2
                }
            }, {
                name: `features`,
                number: 50,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FeatureSet`
            }, {
                name: `verification`,
                number: 3,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.ExtensionRangeOptions.VerificationState`,
                defaultValue: `UNVERIFIED`,
                options: {
                    retention: 2
                }
            }],
            nestedType: [{
                name: `Declaration`,
                field: [{
                    name: `number`,
                    number: 1,
                    type: 5,
                    label: 1
                }, {
                    name: `full_name`,
                    number: 2,
                    type: 9,
                    label: 1
                }, {
                    name: `type`,
                    number: 3,
                    type: 9,
                    label: 1
                }, {
                    name: `reserved`,
                    number: 5,
                    type: 8,
                    label: 1
                }, {
                    name: `repeated`,
                    number: 6,
                    type: 8,
                    label: 1
                }]
            }],
            enumType: [{
                name: `VerificationState`,
                value: [{
                    name: `DECLARATION`,
                    number: 0
                }, {
                    name: `UNVERIFIED`,
                    number: 1
                }]
            }],
            extensionRange: [{
                start: 1e3,
                end: 536870912
            }]
        }, {
            name: `FieldDescriptorProto`,
            field: [{
                name: `name`,
                number: 1,
                type: 9,
                label: 1
            }, {
                name: `number`,
                number: 3,
                type: 5,
                label: 1
            }, {
                name: `label`,
                number: 4,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FieldDescriptorProto.Label`
            }, {
                name: `type`,
                number: 5,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FieldDescriptorProto.Type`
            }, {
                name: `type_name`,
                number: 6,
                type: 9,
                label: 1
            }, {
                name: `extendee`,
                number: 2,
                type: 9,
                label: 1
            }, {
                name: `default_value`,
                number: 7,
                type: 9,
                label: 1
            }, {
                name: `oneof_index`,
                number: 9,
                type: 5,
                label: 1
            }, {
                name: `json_name`,
                number: 10,
                type: 9,
                label: 1
            }, {
                name: `options`,
                number: 8,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FieldOptions`
            }, {
                name: `proto3_optional`,
                number: 17,
                type: 8,
                label: 1
            }],
            enumType: [{
                name: `Type`,
                value: [{
                    name: `TYPE_DOUBLE`,
                    number: 1
                }, {
                    name: `TYPE_FLOAT`,
                    number: 2
                }, {
                    name: `TYPE_INT64`,
                    number: 3
                }, {
                    name: `TYPE_UINT64`,
                    number: 4
                }, {
                    name: `TYPE_INT32`,
                    number: 5
                }, {
                    name: `TYPE_FIXED64`,
                    number: 6
                }, {
                    name: `TYPE_FIXED32`,
                    number: 7
                }, {
                    name: `TYPE_BOOL`,
                    number: 8
                }, {
                    name: `TYPE_STRING`,
                    number: 9
                }, {
                    name: `TYPE_GROUP`,
                    number: 10
                }, {
                    name: `TYPE_MESSAGE`,
                    number: 11
                }, {
                    name: `TYPE_BYTES`,
                    number: 12
                }, {
                    name: `TYPE_UINT32`,
                    number: 13
                }, {
                    name: `TYPE_ENUM`,
                    number: 14
                }, {
                    name: `TYPE_SFIXED32`,
                    number: 15
                }, {
                    name: `TYPE_SFIXED64`,
                    number: 16
                }, {
                    name: `TYPE_SINT32`,
                    number: 17
                }, {
                    name: `TYPE_SINT64`,
                    number: 18
                }]
            }, {
                name: `Label`,
                value: [{
                    name: `LABEL_OPTIONAL`,
                    number: 1
                }, {
                    name: `LABEL_REPEATED`,
                    number: 3
                }, {
                    name: `LABEL_REQUIRED`,
                    number: 2
                }]
            }]
        }, {
            name: `OneofDescriptorProto`,
            field: [{
                name: `name`,
                number: 1,
                type: 9,
                label: 1
            }, {
                name: `options`,
                number: 2,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.OneofOptions`
            }]
        }, {
            name: `EnumDescriptorProto`,
            field: [{
                name: `name`,
                number: 1,
                type: 9,
                label: 1
            }, {
                name: `value`,
                number: 2,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.EnumValueDescriptorProto`
            }, {
                name: `options`,
                number: 3,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.EnumOptions`
            }, {
                name: `reserved_range`,
                number: 4,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.EnumDescriptorProto.EnumReservedRange`
            }, {
                name: `reserved_name`,
                number: 5,
                type: 9,
                label: 3
            }, {
                name: `visibility`,
                number: 6,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.SymbolVisibility`
            }],
            nestedType: [{
                name: `EnumReservedRange`,
                field: [{
                    name: `start`,
                    number: 1,
                    type: 5,
                    label: 1
                }, {
                    name: `end`,
                    number: 2,
                    type: 5,
                    label: 1
                }]
            }]
        }, {
            name: `EnumValueDescriptorProto`,
            field: [{
                name: `name`,
                number: 1,
                type: 9,
                label: 1
            }, {
                name: `number`,
                number: 2,
                type: 5,
                label: 1
            }, {
                name: `options`,
                number: 3,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.EnumValueOptions`
            }]
        }, {
            name: `ServiceDescriptorProto`,
            field: [{
                name: `name`,
                number: 1,
                type: 9,
                label: 1
            }, {
                name: `method`,
                number: 2,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.MethodDescriptorProto`
            }, {
                name: `options`,
                number: 3,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.ServiceOptions`
            }]
        }, {
            name: `MethodDescriptorProto`,
            field: [{
                name: `name`,
                number: 1,
                type: 9,
                label: 1
            }, {
                name: `input_type`,
                number: 2,
                type: 9,
                label: 1
            }, {
                name: `output_type`,
                number: 3,
                type: 9,
                label: 1
            }, {
                name: `options`,
                number: 4,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.MethodOptions`
            }, {
                name: `client_streaming`,
                number: 5,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `server_streaming`,
                number: 6,
                type: 8,
                label: 1,
                defaultValue: `false`
            }]
        }, {
            name: `FileOptions`,
            field: [{
                name: `java_package`,
                number: 1,
                type: 9,
                label: 1
            }, {
                name: `java_outer_classname`,
                number: 8,
                type: 9,
                label: 1
            }, {
                name: `java_multiple_files`,
                number: 10,
                type: 8,
                label: 1,
                defaultValue: `false`,
                options: {}
            }, {
                name: `java_generate_equals_and_hash`,
                number: 20,
                type: 8,
                label: 1,
                options: {
                    deprecated: !0
                }
            }, {
                name: `java_string_check_utf8`,
                number: 27,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `optimize_for`,
                number: 9,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FileOptions.OptimizeMode`,
                defaultValue: `SPEED`
            }, {
                name: `go_package`,
                number: 11,
                type: 9,
                label: 1
            }, {
                name: `cc_generic_services`,
                number: 16,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `java_generic_services`,
                number: 17,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `py_generic_services`,
                number: 18,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `deprecated`,
                number: 23,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `cc_enable_arenas`,
                number: 31,
                type: 8,
                label: 1,
                defaultValue: `true`
            }, {
                name: `objc_class_prefix`,
                number: 36,
                type: 9,
                label: 1
            }, {
                name: `csharp_namespace`,
                number: 37,
                type: 9,
                label: 1
            }, {
                name: `swift_prefix`,
                number: 39,
                type: 9,
                label: 1
            }, {
                name: `php_class_prefix`,
                number: 40,
                type: 9,
                label: 1
            }, {
                name: `php_namespace`,
                number: 41,
                type: 9,
                label: 1
            }, {
                name: `php_metadata_namespace`,
                number: 44,
                type: 9,
                label: 1
            }, {
                name: `ruby_package`,
                number: 45,
                type: 9,
                label: 1
            }, {
                name: `features`,
                number: 50,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FeatureSet`
            }, {
                name: `uninterpreted_option`,
                number: 999,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.UninterpretedOption`
            }],
            enumType: [{
                name: `OptimizeMode`,
                value: [{
                    name: `SPEED`,
                    number: 1
                }, {
                    name: `CODE_SIZE`,
                    number: 2
                }, {
                    name: `LITE_RUNTIME`,
                    number: 3
                }]
            }],
            extensionRange: [{
                start: 1e3,
                end: 536870912
            }]
        }, {
            name: `MessageOptions`,
            field: [{
                name: `message_set_wire_format`,
                number: 1,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `no_standard_descriptor_accessor`,
                number: 2,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `deprecated`,
                number: 3,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `map_entry`,
                number: 7,
                type: 8,
                label: 1
            }, {
                name: `deprecated_legacy_json_field_conflicts`,
                number: 11,
                type: 8,
                label: 1,
                options: {
                    deprecated: !0
                }
            }, {
                name: `features`,
                number: 12,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FeatureSet`
            }, {
                name: `uninterpreted_option`,
                number: 999,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.UninterpretedOption`
            }],
            extensionRange: [{
                start: 1e3,
                end: 536870912
            }]
        }, {
            name: `FieldOptions`,
            field: [{
                name: `ctype`,
                number: 1,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FieldOptions.CType`,
                defaultValue: `STRING`
            }, {
                name: `packed`,
                number: 2,
                type: 8,
                label: 1
            }, {
                name: `jstype`,
                number: 6,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FieldOptions.JSType`,
                defaultValue: `JS_NORMAL`
            }, {
                name: `lazy`,
                number: 5,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `unverified_lazy`,
                number: 15,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `deprecated`,
                number: 3,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `weak`,
                number: 10,
                type: 8,
                label: 1,
                defaultValue: `false`,
                options: {
                    deprecated: !0
                }
            }, {
                name: `debug_redact`,
                number: 16,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `retention`,
                number: 17,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FieldOptions.OptionRetention`
            }, {
                name: `targets`,
                number: 19,
                type: 14,
                label: 3,
                typeName: `.google.protobuf.FieldOptions.OptionTargetType`
            }, {
                name: `edition_defaults`,
                number: 20,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.FieldOptions.EditionDefault`
            }, {
                name: `features`,
                number: 21,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FeatureSet`
            }, {
                name: `feature_support`,
                number: 22,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FieldOptions.FeatureSupport`
            }, {
                name: `uninterpreted_option`,
                number: 999,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.UninterpretedOption`
            }],
            nestedType: [{
                name: `EditionDefault`,
                field: [{
                    name: `edition`,
                    number: 3,
                    type: 14,
                    label: 1,
                    typeName: `.google.protobuf.Edition`
                }, {
                    name: `value`,
                    number: 2,
                    type: 9,
                    label: 1
                }]
            }, {
                name: `FeatureSupport`,
                field: [{
                    name: `edition_introduced`,
                    number: 1,
                    type: 14,
                    label: 1,
                    typeName: `.google.protobuf.Edition`
                }, {
                    name: `edition_deprecated`,
                    number: 2,
                    type: 14,
                    label: 1,
                    typeName: `.google.protobuf.Edition`
                }, {
                    name: `deprecation_warning`,
                    number: 3,
                    type: 9,
                    label: 1
                }, {
                    name: `edition_removed`,
                    number: 4,
                    type: 14,
                    label: 1,
                    typeName: `.google.protobuf.Edition`
                }, {
                    name: `removal_error`,
                    number: 5,
                    type: 9,
                    label: 1
                }]
            }],
            enumType: [{
                name: `CType`,
                value: [{
                    name: `STRING`,
                    number: 0
                }, {
                    name: `CORD`,
                    number: 1
                }, {
                    name: `STRING_PIECE`,
                    number: 2
                }]
            }, {
                name: `JSType`,
                value: [{
                    name: `JS_NORMAL`,
                    number: 0
                }, {
                    name: `JS_STRING`,
                    number: 1
                }, {
                    name: `JS_NUMBER`,
                    number: 2
                }]
            }, {
                name: `OptionRetention`,
                value: [{
                    name: `RETENTION_UNKNOWN`,
                    number: 0
                }, {
                    name: `RETENTION_RUNTIME`,
                    number: 1
                }, {
                    name: `RETENTION_SOURCE`,
                    number: 2
                }]
            }, {
                name: `OptionTargetType`,
                value: [{
                    name: `TARGET_TYPE_UNKNOWN`,
                    number: 0
                }, {
                    name: `TARGET_TYPE_FILE`,
                    number: 1
                }, {
                    name: `TARGET_TYPE_EXTENSION_RANGE`,
                    number: 2
                }, {
                    name: `TARGET_TYPE_MESSAGE`,
                    number: 3
                }, {
                    name: `TARGET_TYPE_FIELD`,
                    number: 4
                }, {
                    name: `TARGET_TYPE_ONEOF`,
                    number: 5
                }, {
                    name: `TARGET_TYPE_ENUM`,
                    number: 6
                }, {
                    name: `TARGET_TYPE_ENUM_ENTRY`,
                    number: 7
                }, {
                    name: `TARGET_TYPE_SERVICE`,
                    number: 8
                }, {
                    name: `TARGET_TYPE_METHOD`,
                    number: 9
                }]
            }],
            extensionRange: [{
                start: 1e3,
                end: 536870912
            }]
        }, {
            name: `OneofOptions`,
            field: [{
                name: `features`,
                number: 1,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FeatureSet`
            }, {
                name: `uninterpreted_option`,
                number: 999,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.UninterpretedOption`
            }],
            extensionRange: [{
                start: 1e3,
                end: 536870912
            }]
        }, {
            name: `EnumOptions`,
            field: [{
                name: `allow_alias`,
                number: 2,
                type: 8,
                label: 1
            }, {
                name: `deprecated`,
                number: 3,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `deprecated_legacy_json_field_conflicts`,
                number: 6,
                type: 8,
                label: 1,
                options: {
                    deprecated: !0
                }
            }, {
                name: `features`,
                number: 7,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FeatureSet`
            }, {
                name: `uninterpreted_option`,
                number: 999,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.UninterpretedOption`
            }],
            extensionRange: [{
                start: 1e3,
                end: 536870912
            }]
        }, {
            name: `EnumValueOptions`,
            field: [{
                name: `deprecated`,
                number: 1,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `features`,
                number: 2,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FeatureSet`
            }, {
                name: `debug_redact`,
                number: 3,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `feature_support`,
                number: 4,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FieldOptions.FeatureSupport`
            }, {
                name: `uninterpreted_option`,
                number: 999,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.UninterpretedOption`
            }],
            extensionRange: [{
                start: 1e3,
                end: 536870912
            }]
        }, {
            name: `ServiceOptions`,
            field: [{
                name: `features`,
                number: 34,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FeatureSet`
            }, {
                name: `deprecated`,
                number: 33,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `uninterpreted_option`,
                number: 999,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.UninterpretedOption`
            }],
            extensionRange: [{
                start: 1e3,
                end: 536870912
            }]
        }, {
            name: `MethodOptions`,
            field: [{
                name: `deprecated`,
                number: 33,
                type: 8,
                label: 1,
                defaultValue: `false`
            }, {
                name: `idempotency_level`,
                number: 34,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.MethodOptions.IdempotencyLevel`,
                defaultValue: `IDEMPOTENCY_UNKNOWN`
            }, {
                name: `features`,
                number: 35,
                type: 11,
                label: 1,
                typeName: `.google.protobuf.FeatureSet`
            }, {
                name: `uninterpreted_option`,
                number: 999,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.UninterpretedOption`
            }],
            enumType: [{
                name: `IdempotencyLevel`,
                value: [{
                    name: `IDEMPOTENCY_UNKNOWN`,
                    number: 0
                }, {
                    name: `NO_SIDE_EFFECTS`,
                    number: 1
                }, {
                    name: `IDEMPOTENT`,
                    number: 2
                }]
            }],
            extensionRange: [{
                start: 1e3,
                end: 536870912
            }]
        }, {
            name: `UninterpretedOption`,
            field: [{
                name: `name`,
                number: 2,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.UninterpretedOption.NamePart`
            }, {
                name: `identifier_value`,
                number: 3,
                type: 9,
                label: 1
            }, {
                name: `positive_int_value`,
                number: 4,
                type: 4,
                label: 1
            }, {
                name: `negative_int_value`,
                number: 5,
                type: 3,
                label: 1
            }, {
                name: `double_value`,
                number: 6,
                type: 1,
                label: 1
            }, {
                name: `string_value`,
                number: 7,
                type: 12,
                label: 1
            }, {
                name: `aggregate_value`,
                number: 8,
                type: 9,
                label: 1
            }],
            nestedType: [{
                name: `NamePart`,
                field: [{
                    name: `name_part`,
                    number: 1,
                    type: 9,
                    label: 2
                }, {
                    name: `is_extension`,
                    number: 2,
                    type: 8,
                    label: 2
                }]
            }]
        }, {
            name: `FeatureSet`,
            field: [{
                name: `field_presence`,
                number: 1,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FeatureSet.FieldPresence`,
                options: {
                    retention: 1,
                    targets: [4, 1],
                    editionDefaults: [{
                        value: `EXPLICIT`,
                        edition: 900
                    }, {
                        value: `IMPLICIT`,
                        edition: 999
                    }, {
                        value: `EXPLICIT`,
                        edition: 1e3
                    }]
                }
            }, {
                name: `enum_type`,
                number: 2,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FeatureSet.EnumType`,
                options: {
                    retention: 1,
                    targets: [6, 1],
                    editionDefaults: [{
                        value: `CLOSED`,
                        edition: 900
                    }, {
                        value: `OPEN`,
                        edition: 999
                    }]
                }
            }, {
                name: `repeated_field_encoding`,
                number: 3,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FeatureSet.RepeatedFieldEncoding`,
                options: {
                    retention: 1,
                    targets: [4, 1],
                    editionDefaults: [{
                        value: `EXPANDED`,
                        edition: 900
                    }, {
                        value: `PACKED`,
                        edition: 999
                    }]
                }
            }, {
                name: `utf8_validation`,
                number: 4,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FeatureSet.Utf8Validation`,
                options: {
                    retention: 1,
                    targets: [4, 1],
                    editionDefaults: [{
                        value: `NONE`,
                        edition: 900
                    }, {
                        value: `VERIFY`,
                        edition: 999
                    }]
                }
            }, {
                name: `message_encoding`,
                number: 5,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FeatureSet.MessageEncoding`,
                options: {
                    retention: 1,
                    targets: [4, 1],
                    editionDefaults: [{
                        value: `LENGTH_PREFIXED`,
                        edition: 900
                    }]
                }
            }, {
                name: `json_format`,
                number: 6,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FeatureSet.JsonFormat`,
                options: {
                    retention: 1,
                    targets: [3, 6, 1],
                    editionDefaults: [{
                        value: `LEGACY_BEST_EFFORT`,
                        edition: 900
                    }, {
                        value: `ALLOW`,
                        edition: 999
                    }]
                }
            }, {
                name: `enforce_naming_style`,
                number: 7,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FeatureSet.EnforceNamingStyle`,
                options: {
                    retention: 2,
                    targets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                    editionDefaults: [{
                        value: `STYLE_LEGACY`,
                        edition: 900
                    }, {
                        value: `STYLE2024`,
                        edition: 1001
                    }]
                }
            }, {
                name: `default_symbol_visibility`,
                number: 8,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.FeatureSet.VisibilityFeature.DefaultSymbolVisibility`,
                options: {
                    retention: 2,
                    targets: [1],
                    editionDefaults: [{
                        value: `EXPORT_ALL`,
                        edition: 900
                    }, {
                        value: `EXPORT_TOP_LEVEL`,
                        edition: 1001
                    }]
                }
            }],
            nestedType: [{
                name: `VisibilityFeature`,
                enumType: [{
                    name: `DefaultSymbolVisibility`,
                    value: [{
                        name: `DEFAULT_SYMBOL_VISIBILITY_UNKNOWN`,
                        number: 0
                    }, {
                        name: `EXPORT_ALL`,
                        number: 1
                    }, {
                        name: `EXPORT_TOP_LEVEL`,
                        number: 2
                    }, {
                        name: `LOCAL_ALL`,
                        number: 3
                    }, {
                        name: `STRICT`,
                        number: 4
                    }]
                }]
            }],
            enumType: [{
                name: `FieldPresence`,
                value: [{
                    name: `FIELD_PRESENCE_UNKNOWN`,
                    number: 0
                }, {
                    name: `EXPLICIT`,
                    number: 1
                }, {
                    name: `IMPLICIT`,
                    number: 2
                }, {
                    name: `LEGACY_REQUIRED`,
                    number: 3
                }]
            }, {
                name: `EnumType`,
                value: [{
                    name: `ENUM_TYPE_UNKNOWN`,
                    number: 0
                }, {
                    name: `OPEN`,
                    number: 1
                }, {
                    name: `CLOSED`,
                    number: 2
                }]
            }, {
                name: `RepeatedFieldEncoding`,
                value: [{
                    name: `REPEATED_FIELD_ENCODING_UNKNOWN`,
                    number: 0
                }, {
                    name: `PACKED`,
                    number: 1
                }, {
                    name: `EXPANDED`,
                    number: 2
                }]
            }, {
                name: `Utf8Validation`,
                value: [{
                    name: `UTF8_VALIDATION_UNKNOWN`,
                    number: 0
                }, {
                    name: `VERIFY`,
                    number: 2
                }, {
                    name: `NONE`,
                    number: 3
                }]
            }, {
                name: `MessageEncoding`,
                value: [{
                    name: `MESSAGE_ENCODING_UNKNOWN`,
                    number: 0
                }, {
                    name: `LENGTH_PREFIXED`,
                    number: 1
                }, {
                    name: `DELIMITED`,
                    number: 2
                }]
            }, {
                name: `JsonFormat`,
                value: [{
                    name: `JSON_FORMAT_UNKNOWN`,
                    number: 0
                }, {
                    name: `ALLOW`,
                    number: 1
                }, {
                    name: `LEGACY_BEST_EFFORT`,
                    number: 2
                }]
            }, {
                name: `EnforceNamingStyle`,
                value: [{
                    name: `ENFORCE_NAMING_STYLE_UNKNOWN`,
                    number: 0
                }, {
                    name: `STYLE2024`,
                    number: 1
                }, {
                    name: `STYLE_LEGACY`,
                    number: 2
                }]
            }],
            extensionRange: [{
                start: 1e3,
                end: 9995
            }, {
                start: 9995,
                end: 1e4
            }, {
                start: 1e4,
                end: 10001
            }]
        }, {
            name: `FeatureSetDefaults`,
            field: [{
                name: `defaults`,
                number: 1,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault`
            }, {
                name: `minimum_edition`,
                number: 4,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.Edition`
            }, {
                name: `maximum_edition`,
                number: 5,
                type: 14,
                label: 1,
                typeName: `.google.protobuf.Edition`
            }],
            nestedType: [{
                name: `FeatureSetEditionDefault`,
                field: [{
                    name: `edition`,
                    number: 3,
                    type: 14,
                    label: 1,
                    typeName: `.google.protobuf.Edition`
                }, {
                    name: `overridable_features`,
                    number: 4,
                    type: 11,
                    label: 1,
                    typeName: `.google.protobuf.FeatureSet`
                }, {
                    name: `fixed_features`,
                    number: 5,
                    type: 11,
                    label: 1,
                    typeName: `.google.protobuf.FeatureSet`
                }]
            }]
        }, {
            name: `SourceCodeInfo`,
            field: [{
                name: `location`,
                number: 1,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.SourceCodeInfo.Location`
            }],
            nestedType: [{
                name: `Location`,
                field: [{
                    name: `path`,
                    number: 1,
                    type: 5,
                    label: 3,
                    options: {
                        packed: !0
                    }
                }, {
                    name: `span`,
                    number: 2,
                    type: 5,
                    label: 3,
                    options: {
                        packed: !0
                    }
                }, {
                    name: `leading_comments`,
                    number: 3,
                    type: 9,
                    label: 1
                }, {
                    name: `trailing_comments`,
                    number: 4,
                    type: 9,
                    label: 1
                }, {
                    name: `leading_detached_comments`,
                    number: 6,
                    type: 9,
                    label: 3
                }]
            }],
            extensionRange: [{
                start: 536e6,
                end: 536000001
            }]
        }, {
            name: `GeneratedCodeInfo`,
            field: [{
                name: `annotation`,
                number: 1,
                type: 11,
                label: 3,
                typeName: `.google.protobuf.GeneratedCodeInfo.Annotation`
            }],
            nestedType: [{
                name: `Annotation`,
                field: [{
                    name: `path`,
                    number: 1,
                    type: 5,
                    label: 3,
                    options: {
                        packed: !0
                    }
                }, {
                    name: `source_file`,
                    number: 2,
                    type: 9,
                    label: 1
                }, {
                    name: `begin`,
                    number: 3,
                    type: 5,
                    label: 1
                }, {
                    name: `end`,
                    number: 4,
                    type: 5,
                    label: 1
                }, {
                    name: `semantic`,
                    number: 5,
                    type: 14,
                    label: 1,
                    typeName: `.google.protobuf.GeneratedCodeInfo.Annotation.Semantic`
                }],
                enumType: [{
                    name: `Semantic`,
                    value: [{
                        name: `NONE`,
                        number: 0
                    }, {
                        name: `SET`,
                        number: 1
                    }, {
                        name: `ALIAS`,
                        number: 2
                    }]
                }]
            }]
        }],
        enumType: [{
            name: `Edition`,
            value: [{
                name: `EDITION_UNKNOWN`,
                number: 0
            }, {
                name: `EDITION_LEGACY`,
                number: 900
            }, {
                name: `EDITION_PROTO2`,
                number: 998
            }, {
                name: `EDITION_PROTO3`,
                number: 999
            }, {
                name: `EDITION_2023`,
                number: 1e3
            }, {
                name: `EDITION_2024`,
                number: 1001
            }, {
                name: `EDITION_UNSTABLE`,
                number: 9999
            }, {
                name: `EDITION_1_TEST_ONLY`,
                number: 1
            }, {
                name: `EDITION_2_TEST_ONLY`,
                number: 2
            }, {
                name: `EDITION_99997_TEST_ONLY`,
                number: 99997
            }, {
                name: `EDITION_99998_TEST_ONLY`,
                number: 99998
            }, {
                name: `EDITION_99999_TEST_ONLY`,
                number: 99999
            }, {
                name: `EDITION_MAX`,
                number: 2147483647
            }]
        }, {
            name: `SymbolVisibility`,
            value: [{
                name: `VISIBILITY_UNSET`,
                number: 0
            }, {
                name: `VISIBILITY_LOCAL`,
                number: 1
            }, {
                name: `VISIBILITY_EXPORT`,
                number: 2
            }]
        }]
    }),
    Gn = P(Wn, 1),
    Kn;
(function(e) {
    e[e.DECLARATION = 0] = `DECLARATION`, e[e.UNVERIFIED = 1] = `UNVERIFIED`
})(Kn || = {});
var qn;
(function(e) {
    e[e.DOUBLE = 1] = `DOUBLE`, e[e.FLOAT = 2] = `FLOAT`, e[e.INT64 = 3] = `INT64`, e[e.UINT64 = 4] = `UINT64`, e[e.INT32 = 5] = `INT32`, e[e.FIXED64 = 6] = `FIXED64`, e[e.FIXED32 = 7] = `FIXED32`, e[e.BOOL = 8] = `BOOL`, e[e.STRING = 9] = `STRING`, e[e.GROUP = 10] = `GROUP`, e[e.MESSAGE = 11] = `MESSAGE`, e[e.BYTES = 12] = `BYTES`, e[e.UINT32 = 13] = `UINT32`, e[e.ENUM = 14] = `ENUM`, e[e.SFIXED32 = 15] = `SFIXED32`, e[e.SFIXED64 = 16] = `SFIXED64`, e[e.SINT32 = 17] = `SINT32`, e[e.SINT64 = 18] = `SINT64`
})(qn || = {});
var Jn;
(function(e) {
    e[e.OPTIONAL = 1] = `OPTIONAL`, e[e.REPEATED = 3] = `REPEATED`, e[e.REQUIRED = 2] = `REQUIRED`
})(Jn || = {});
var Yn;
(function(e) {
    e[e.SPEED = 1] = `SPEED`, e[e.CODE_SIZE = 2] = `CODE_SIZE`, e[e.LITE_RUNTIME = 3] = `LITE_RUNTIME`
})(Yn || = {});
var Xn;
(function(e) {
    e[e.STRING = 0] = `STRING`, e[e.CORD = 1] = `CORD`, e[e.STRING_PIECE = 2] = `STRING_PIECE`
})(Xn || = {});
var Zn;
(function(e) {
    e[e.JS_NORMAL = 0] = `JS_NORMAL`, e[e.JS_STRING = 1] = `JS_STRING`, e[e.JS_NUMBER = 2] = `JS_NUMBER`
})(Zn || = {});
var Qn;
(function(e) {
    e[e.RETENTION_UNKNOWN = 0] = `RETENTION_UNKNOWN`, e[e.RETENTION_RUNTIME = 1] = `RETENTION_RUNTIME`, e[e.RETENTION_SOURCE = 2] = `RETENTION_SOURCE`
})(Qn || = {});
var $n;
(function(e) {
    e[e.TARGET_TYPE_UNKNOWN = 0] = `TARGET_TYPE_UNKNOWN`, e[e.TARGET_TYPE_FILE = 1] = `TARGET_TYPE_FILE`, e[e.TARGET_TYPE_EXTENSION_RANGE = 2] = `TARGET_TYPE_EXTENSION_RANGE`, e[e.TARGET_TYPE_MESSAGE = 3] = `TARGET_TYPE_MESSAGE`, e[e.TARGET_TYPE_FIELD = 4] = `TARGET_TYPE_FIELD`, e[e.TARGET_TYPE_ONEOF = 5] = `TARGET_TYPE_ONEOF`, e[e.TARGET_TYPE_ENUM = 6] = `TARGET_TYPE_ENUM`, e[e.TARGET_TYPE_ENUM_ENTRY = 7] = `TARGET_TYPE_ENUM_ENTRY`, e[e.TARGET_TYPE_SERVICE = 8] = `TARGET_TYPE_SERVICE`, e[e.TARGET_TYPE_METHOD = 9] = `TARGET_TYPE_METHOD`
})($n || = {});
var er;
(function(e) {
    e[e.IDEMPOTENCY_UNKNOWN = 0] = `IDEMPOTENCY_UNKNOWN`, e[e.NO_SIDE_EFFECTS = 1] = `NO_SIDE_EFFECTS`, e[e.IDEMPOTENT = 2] = `IDEMPOTENT`
})(er || = {});
var tr;
(function(e) {
    e[e.DEFAULT_SYMBOL_VISIBILITY_UNKNOWN = 0] = `DEFAULT_SYMBOL_VISIBILITY_UNKNOWN`, e[e.EXPORT_ALL = 1] = `EXPORT_ALL`, e[e.EXPORT_TOP_LEVEL = 2] = `EXPORT_TOP_LEVEL`, e[e.LOCAL_ALL = 3] = `LOCAL_ALL`, e[e.STRICT = 4] = `STRICT`
})(tr || = {});
var nr;
(function(e) {
    e[e.FIELD_PRESENCE_UNKNOWN = 0] = `FIELD_PRESENCE_UNKNOWN`, e[e.EXPLICIT = 1] = `EXPLICIT`, e[e.IMPLICIT = 2] = `IMPLICIT`, e[e.LEGACY_REQUIRED = 3] = `LEGACY_REQUIRED`
})(nr || = {});
var rr;
(function(e) {
    e[e.ENUM_TYPE_UNKNOWN = 0] = `ENUM_TYPE_UNKNOWN`, e[e.OPEN = 1] = `OPEN`, e[e.CLOSED = 2] = `CLOSED`
})(rr || = {});
var ir;
(function(e) {
    e[e.REPEATED_FIELD_ENCODING_UNKNOWN = 0] = `REPEATED_FIELD_ENCODING_UNKNOWN`, e[e.PACKED = 1] = `PACKED`, e[e.EXPANDED = 2] = `EXPANDED`
})(ir || = {});
var ar;
(function(e) {
    e[e.UTF8_VALIDATION_UNKNOWN = 0] = `UTF8_VALIDATION_UNKNOWN`, e[e.VERIFY = 2] = `VERIFY`, e[e.NONE = 3] = `NONE`
})(ar || = {});
var or;
(function(e) {
    e[e.MESSAGE_ENCODING_UNKNOWN = 0] = `MESSAGE_ENCODING_UNKNOWN`, e[e.LENGTH_PREFIXED = 1] = `LENGTH_PREFIXED`, e[e.DELIMITED = 2] = `DELIMITED`
})(or || = {});
var sr;
(function(e) {
    e[e.JSON_FORMAT_UNKNOWN = 0] = `JSON_FORMAT_UNKNOWN`, e[e.ALLOW = 1] = `ALLOW`, e[e.LEGACY_BEST_EFFORT = 2] = `LEGACY_BEST_EFFORT`
})(sr || = {});
var cr;
(function(e) {
    e[e.ENFORCE_NAMING_STYLE_UNKNOWN = 0] = `ENFORCE_NAMING_STYLE_UNKNOWN`, e[e.STYLE2024 = 1] = `STYLE2024`, e[e.STYLE_LEGACY = 2] = `STYLE_LEGACY`
})(cr || = {});
var lr;
(function(e) {
    e[e.NONE = 0] = `NONE`, e[e.SET = 1] = `SET`, e[e.ALIAS = 2] = `ALIAS`
})(lr || = {});
var ur;
(function(e) {
    e[e.EDITION_UNKNOWN = 0] = `EDITION_UNKNOWN`, e[e.EDITION_LEGACY = 900] = `EDITION_LEGACY`, e[e.EDITION_PROTO2 = 998] = `EDITION_PROTO2`, e[e.EDITION_PROTO3 = 999] = `EDITION_PROTO3`, e[e.EDITION_2023 = 1e3] = `EDITION_2023`, e[e.EDITION_2024 = 1001] = `EDITION_2024`, e[e.EDITION_UNSTABLE = 9999] = `EDITION_UNSTABLE`, e[e.EDITION_1_TEST_ONLY = 1] = `EDITION_1_TEST_ONLY`, e[e.EDITION_2_TEST_ONLY = 2] = `EDITION_2_TEST_ONLY`, e[e.EDITION_99997_TEST_ONLY = 99997] = `EDITION_99997_TEST_ONLY`, e[e.EDITION_99998_TEST_ONLY = 99998] = `EDITION_99998_TEST_ONLY`, e[e.EDITION_99999_TEST_ONLY = 99999] = `EDITION_99999_TEST_ONLY`, e[e.EDITION_MAX = 2147483647] = `EDITION_MAX`
})(ur || = {});
var dr;
(function(e) {
    e[e.VISIBILITY_UNSET = 0] = `VISIBILITY_UNSET`, e[e.VISIBILITY_LOCAL = 1] = `VISIBILITY_LOCAL`, e[e.VISIBILITY_EXPORT = 2] = `VISIBILITY_EXPORT`
})(dr || = {});
var fr = {
    readUnknownFields: !0
};

function pr(e) {
    return e ? Object.assign(Object.assign({}, fr), e) : fr
}

function mr(e, t, n) {
    let r = N(e, void 0, !1);
    return hr(r, new Ft(t), pr(n), !1, t.byteLength), r.message
}

function hr(e, t, n, r, i) {
    let a = r ? t.len : t.pos + i,
        o, s, c = e.getUnknown() ? ? [];
    for (; t.pos < a && ([o, s] = t.tag(), !(r && s == O.EndGroup));) {
        let r = e.findNumber(o);
        if (!r) {
            let e = t.skip(s, o);
            n.readUnknownFields && c.push({
                no: o,
                wireType: s,
                data: e
            });
            continue
        }
        gr(e, t, r, s, n)
    }
    if (r && (s != O.EndGroup || o !== i)) throw Error(`invalid end group tag`);
    c.length > 0 && e.setUnknown(c)
}

function gr(e, t, n, r, i) {
    switch (n.fieldKind) {
        case `scalar`:
            e.set(n, F(t, n.scalar, n.utf8Validation));
            break;
        case `enum`:
            let a = F(t, y.INT32);
            if (n.enum.open) e.set(n, a);
            else if (n.enum.values.some(e => e.number === a)) e.set(n, a);
            else if (i.readUnknownFields) {
                let t = [];
                oe(a, t);
                let i = e.getUnknown() ? ? [];
                i.push({
                    no: n.number,
                    wireType: r,
                    data: new Uint8Array(t)
                }), e.setUnknown(i)
            }
            break;
        case `message`:
            e.set(n, yr(t, i, n, e.get(n)));
            break;
        case `list`:
            vr(t, r, e.get(n), i);
            break;
        case `map`:
            _r(t, e.get(n), i);
            break
    }
}

function _r(e, t, n) {
    let r = t.field(),
        i, a, o = e.uint32(),
        s = e.pos + o;
    for (; e.pos < s;) {
        let [t] = e.tag();
        switch (t) {
            case 1:
                i = F(e, r.mapKey, r.utf8Validation);
                break;
            case 2:
                switch (r.mapKind) {
                    case `scalar`:
                        a = F(e, r.scalar, r.utf8Validation);
                        break;
                    case `enum`:
                        a = e.int32();
                        break;
                    case `message`:
                        a = yr(e, n, r);
                        break
                }
                break
        }
    }
    if (i === void 0 && (i = b(r.mapKey, !1)), a === void 0) switch (r.mapKind) {
        case `scalar`:
            a = b(r.scalar, !1);
            break;
        case `enum`:
            a = r.enum.values[0].number;
            break;
        case `message`:
            a = N(r.message, void 0, !1);
            break
    }
    t.set(i, a)
}

function vr(e, t, n, r) {
    let i = n.field();
    if (i.listKind === `message`) {
        n.add(yr(e, r, i));
        return
    }
    let a = i.scalar ? ? y.INT32;
    if (!(t == O.LengthDelimited && a != y.STRING && a != y.BYTES)) {
        n.add(F(e, a, i.utf8Validation));
        return
    }
    let o = e.uint32() + e.pos;
    for (; e.pos < o;) n.add(F(e, a, i.utf8Validation))
}

function yr(e, t, n, r) {
    let i = n.delimitedEncoding,
        a = r ? ? N(n.message, void 0, !1);
    return hr(a, e, t, i, i ? n.number : e.uint32()), a
}

function F(e, t, n = !1) {
    switch (t) {
        case y.STRING:
            return e.string(n);
        case y.BOOL:
            return e.bool();
        case y.DOUBLE:
            return e.double();
        case y.FLOAT:
            return e.float();
        case y.INT32:
            return e.int32();
        case y.INT64:
            return e.int64();
        case y.UINT64:
            return e.uint64();
        case y.FIXED64:
            return e.fixed64();
        case y.BYTES:
            return e.bytes();
        case y.FIXED32:
            return e.fixed32();
        case y.SFIXED32:
            return e.sfixed32();
        case y.SFIXED64:
            return e.sfixed64();
        case y.SINT64:
            return e.sint64();
        case y.UINT32:
            return e.uint32();
        case y.SINT32:
            return e.sint32()
    }
}

function I(e, t) {
    let n = mr(Gn, bt(e));
    return n.messageType.forEach(ye), n.dependency = t ? .map(e => e.proto.name) ? ? [], we(n, e => t ? .find(t => t.proto.name === e)).getFile(n.name)
}

function br(e, t, ...n) {
    if (n.length > 0) throw Error();
    return e.services[t]
}
var xr = I(`Ch9nb29nbGUvcHJvdG9idWYvdGltZXN0YW1wLnByb3RvEg9nb29nbGUucHJvdG9idWYiKwoJVGltZXN0YW1wEg8KB3NlY29uZHMYASABKAMSDQoFbmFub3MYAiABKAVChQEKE2NvbS5nb29nbGUucHJvdG9idWZCDlRpbWVzdGFtcFByb3RvUAFaMmdvb2dsZS5nb2xhbmcub3JnL3Byb3RvYnVmL3R5cGVzL2tub3duL3RpbWVzdGFtcHBi+AEBogIDR1BCqgIeR29vZ2xlLlByb3RvYnVmLldlbGxLbm93blR5cGVzYgZwcm90bzM`),
    Sr = I(`Chlnb29nbGUvcHJvdG9idWYvYW55LnByb3RvEg9nb29nbGUucHJvdG9idWYiJgoDQW55EhAKCHR5cGVfdXJsGAEgASgJEg0KBXZhbHVlGAIgASgMQnYKE2NvbS5nb29nbGUucHJvdG9idWZCCEFueVByb3RvUAFaLGdvb2dsZS5nb2xhbmcub3JnL3Byb3RvYnVmL3R5cGVzL2tub3duL2FueXBiogIDR1BCqgIeR29vZ2xlLlByb3RvYnVmLldlbGxLbm93blR5cGVzYgZwcm90bzM`),
    Cr = P(Sr, 0);

function wr(e, t, n) {
    let r = !1;
    return n || (n = M(Cr), r = !0), n.value = Fn(e, t), n.typeUrl = Dr(t.$typeName), r ? n : void 0
}

function Tr(e, t) {
    return e.typeUrl === `` ? !1 : (typeof t == `string` ? t : t.typeName) === Or(e.typeUrl)
}

function Er(e, t) {
    if (e.typeUrl === ``) return;
    let n = t.kind == `message` ? t : t.getMessage(Or(e.typeUrl));
    if (!(!n || !Tr(e, n))) return mr(n, e.value)
}

function Dr(e) {
    return `type.googleapis.com/${e}`
}

function Or(e) {
    let t = e.lastIndexOf(`/`),
        n = t >= 0 ? e.substring(t + 1) : e;
    if (!n.length) throw Error(`invalid type url: ${e}`);
    return n
}
var kr = I(`Chxnb29nbGUvcHJvdG9idWYvc3RydWN0LnByb3RvEg9nb29nbGUucHJvdG9idWYihAEKBlN0cnVjdBIzCgZmaWVsZHMYASADKAsyIy5nb29nbGUucHJvdG9idWYuU3RydWN0LkZpZWxkc0VudHJ5GkUKC0ZpZWxkc0VudHJ5EgsKA2tleRgBIAEoCRIlCgV2YWx1ZRgCIAEoCzIWLmdvb2dsZS5wcm90b2J1Zi5WYWx1ZToCOAEi6gEKBVZhbHVlEjAKCm51bGxfdmFsdWUYASABKA4yGi5nb29nbGUucHJvdG9idWYuTnVsbFZhbHVlSAASFgoMbnVtYmVyX3ZhbHVlGAIgASgBSAASFgoMc3RyaW5nX3ZhbHVlGAMgASgJSAASFAoKYm9vbF92YWx1ZRgEIAEoCEgAEi8KDHN0cnVjdF92YWx1ZRgFIAEoCzIXLmdvb2dsZS5wcm90b2J1Zi5TdHJ1Y3RIABIwCgpsaXN0X3ZhbHVlGAYgASgLMhouZ29vZ2xlLnByb3RvYnVmLkxpc3RWYWx1ZUgAQgYKBGtpbmQiMwoJTGlzdFZhbHVlEiYKBnZhbHVlcxgBIAMoCzIWLmdvb2dsZS5wcm90b2J1Zi5WYWx1ZSobCglOdWxsVmFsdWUSDgoKTlVMTF9WQUxVRRAAQn8KE2NvbS5nb29nbGUucHJvdG9idWZCC1N0cnVjdFByb3RvUAFaL2dvb2dsZS5nb2xhbmcub3JnL3Byb3RvYnVmL3R5cGVzL2tub3duL3N0cnVjdHBi+AEBogIDR1BCqgIeR29vZ2xlLlByb3RvYnVmLldlbGxLbm93blR5cGVzYgZwcm90bzM`),
    Ar = P(kr, 0),
    jr = P(kr, 1),
    Mr = P(kr, 2),
    Nr;
(function(e) {
    e[e.NULL_VALUE = 0] = `NULL_VALUE`
})(Nr || = {});
var Pr = I(`CjFhbnRocm9waWMvb21lbGV0dGUvYXBpL3YxYWxwaGEvb21lbGV0dGVfYXBpLnByb3RvEh5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEiDgoMR2V0TWVSZXF1ZXN0IjMKGFNldE1vZGVsU2VsZWN0aW9uUmVxdWVzdBIXCgVtb2RlbBgBIAEoCUIIukgFcgMYgAEiGwoZU2V0TW9kZWxTZWxlY3Rpb25SZXNwb25zZSKyBQoNR2V0TWVSZXNwb25zZRIUCgxhY2NvdW50X3V1aWQYASABKAkSGQoRb3JnYW5pemF0aW9uX3V1aWQYAiABKAkSDQoFZW1haWwYAyABKAkSFAoMZGlzcGxheV9uYW1lGAQgASgJEhAKCG9yZ19uYW1lGAUgASgJEhoKEmdyb3d0aGJvb2tfcGF5bG9hZBgGIAEoCRIUCgxpc19hbnRocm9waWMYByABKAgSQgoNbW9kZWxfcHJlc2V0cxgIIAMoCzIrLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Nb2RlbFByZXNldBIYChBkZWZhdWx0X21vZGVsX2lkGAkgASgJEh0KFW92ZXJyaWRlX3N0aWNreV9tb2RlbBgKIAEoCBIXCg9pc19wZXJzb25hbF9vcmcYCyABKAgSQQoMYWNjZXNzX2xldmVsGAwgASgOMisuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkFjY2Vzc0xldmVsEhQKDGhhc19wcm9qZWN0cxgNIAEoCBIcChBoYXNfb2F1dGhfdG9rZW5zGA4gASgIQgIYARIaChJkc19tYW5hZ2VfZW5mb3JjZWQYDyABKAgSFQoNY2FuX21hbmFnZV9kcxgQIAEoCBJCCgttZW1iZXJzaGlwcxgRIAMoCzItLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5PcmdNZW1iZXJzaGlwEhoKEmNhbl9tYW5hZ2VfYmlsbGluZxgSIAEoCBIhChloYXNfdXNhZ2VfYmFzZWRfc2VhdF90aWVyGBMgASgIEiYKGW9yZ19zY29wZV9zaGFyaW5nX2FsbG93ZWQYFCABKAhIAIgBAUIcChpfb3JnX3Njb3BlX3NoYXJpbmdfYWxsb3dlZCIrCg1PcmdNZW1iZXJzaGlwEgwKBHV1aWQYASABKAkSDAoEbmFtZRgCIAEoCSLNAQoLTW9kZWxQcmVzZXQSCgoCaWQYASABKAkSDQoFbGFiZWwYAiABKAkSEgoKbWF4X3Rva2VucxgDIAEoBRIiChpzdXBwb3J0c19hZGFwdGl2ZV90aGlua2luZxgEIAEoCBITCgtkZXNjcmlwdGlvbhgFIAEoCRIQCghvdmVyZmxvdxgGIAEoCBJECg5lZmZvcnRfb3B0aW9ucxgHIAMoCzIsLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5FZmZvcnRPcHRpb24iPQoMRWZmb3J0T3B0aW9uEgoKAmlkGAEgASgJEgwKBG5hbWUYAiABKAkSEwoLcmVjb21tZW5kZWQYAyABKAgiFwoVR2V0VXNhZ2VTdGF0dXNSZXF1ZXN0Ir8EChZHZXRVc2FnZVN0YXR1c1Jlc3BvbnNlEkYKEnNldmVuX2RheV9vbWVsZXR0ZRgBIAEoCzIqLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DbGFpbVVzYWdlEkgKFG9tZWxldHRlX3Byb21vdGlvbmFsGAIgASgLMiouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNsYWltVXNhZ2USRQoLZXh0cmFfdXNhZ2UYAyABKAsyMC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRXh0cmFVc2FnZVN0YXR1cxI9CglmaXZlX2hvdXIYBCABKAsyKi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ2xhaW1Vc2FnZRI9CglzZXZlbl9kYXkYBSABKAsyKi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ2xhaW1Vc2FnZRJCCg5zZXZlbl9kYXlfb3B1cxgGIAEoCzIqLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DbGFpbVVzYWdlEkQKEHNldmVuX2RheV9zb25uZXQYByABKAsyKi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ2xhaW1Vc2FnZRJEChBzZXZlbl9kYXlfY293b3JrGAggASgLMiouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNsYWltVXNhZ2UiXAoKQ2xhaW1Vc2FnZRIYCgt1dGlsaXphdGlvbhgBIAEoAkgAiAEBEhYKCXJlc2V0c19hdBgCIAEoA0gBiAEBQg4KDF91dGlsaXphdGlvbkIMCgpfcmVzZXRzX2F0IoACChBFeHRyYVVzYWdlU3RhdHVzEhIKCmlzX2VuYWJsZWQYASABKAgSGAoLdXRpbGl6YXRpb24YAiABKAJIAIgBARIcCg9kaXNhYmxlZF9yZWFzb24YAyABKAlIAYgBARIaCg1tb250aGx5X2xpbWl0GAQgASgDSAKIAQESGQoMdXNlZF9jcmVkaXRzGAUgASgBSAOIAQESFQoIY3VycmVuY3kYBiABKAlIBIgBAUIOCgxfdXRpbGl6YXRpb25CEgoQX2Rpc2FibGVkX3JlYXNvbkIQCg5fbW9udGhseV9saW1pdEIPCg1fdXNlZF9jcmVkaXRzQgsKCV9jdXJyZW5jeSIZChdHZXRDcmVkaXRCdW5kbGVzUmVxdWVzdCKSAgoYR2V0Q3JlZGl0QnVuZGxlc1Jlc3BvbnNlEj0KB2J1bmRsZXMYASADKAsyLC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ3JlZGl0QnVuZGxlElEKFWN1c3RvbV9kaXNjb3VudF90aWVycxgCIAMoCzIyLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DcmVkaXREaXNjb3VudFRpZXISEAoIY3VycmVuY3kYAyABKAkSJgoeYnVuZGxlX21vbnRobHlfY2FwX21pbm9yX3VuaXRzGAQgASgDEioKImJ1bmRsZV9wYWlkX3RoaXNfbW9udGhfbWlub3JfdW5pdHMYBSABKAMiqgEKDENyZWRpdEJ1bmRsZRIKCgJpZBgBIAEoCRIaChJjcmVkaXRfbWlub3JfdW5pdHMYAiABKAMSGQoRcHJpY2VfbWlub3JfdW5pdHMYAyABKAMSFAoMZGlzY291bnRfcGN0GAQgASgCEiAKGGxvY2FsX2NyZWRpdF9taW5vcl91bml0cxgFIAEoAxIfChdsb2NhbF9wcmljZV9taW5vcl91bml0cxgGIAEoAyJjChJDcmVkaXREaXNjb3VudFRpZXISFwoPbWluX21pbm9yX3VuaXRzGAEgASgDEhQKDGRpc2NvdW50X3BjdBgCIAEoAhIeChZtYXhfY3JlZGl0X21pbm9yX3VuaXRzGAMgASgDIhkKF0dldFBheW1lbnRNZXRob2RSZXF1ZXN0InkKGEdldFBheW1lbnRNZXRob2RSZXNwb25zZRJKCg5wYXltZW50X21ldGhvZBgBIAEoCzItLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5QYXltZW50TWV0aG9kSACIAQFCEQoPX3BheW1lbnRfbWV0aG9kIjsKDVBheW1lbnRNZXRob2QSDQoFYnJhbmQYASABKAkSDQoFbGFzdDQYAiABKAkSDAoEdHlwZRgDIAEoCSIaChhHZXRQcmVwYWlkQmFsYW5jZVJlcXVlc3QiZgoZR2V0UHJlcGFpZEJhbGFuY2VSZXNwb25zZRIaChJhbW91bnRfbWlub3JfdW5pdHMYASABKAMSEAoIY3VycmVuY3kYAiABKAkSGwoTYXV0b19yZWxvYWRfZW5hYmxlZBgDIAEoCCJ/ChpTZXR1cE92ZXJhZ2VCaWxsaW5nUmVxdWVzdBI5CiNvcmdfbW9udGhseV9zcGVuZF9saW1pdF9taW5vcl91bml0cxgBIAEoA0IHukgEIgIoAEgAiAEBQiYKJF9vcmdfbW9udGhseV9zcGVuZF9saW1pdF9taW5vcl91bml0cyIyChtTZXR1cE92ZXJhZ2VCaWxsaW5nUmVzcG9uc2USEwoLY29udHJhY3RfaWQYASABKAkiggEKGFNldE92ZXJhZ2VFbmFibGVkUmVxdWVzdBISCgppc19lbmFibGVkGAEgASgIEi0KIG1vbnRobHlfY3JlZGl0X2xpbWl0X21pbm9yX3VuaXRzGAIgASgDSACIAQFCIwohX21vbnRobHlfY3JlZGl0X2xpbWl0X21pbm9yX3VuaXRzImIKGVNldE92ZXJhZ2VFbmFibGVkUmVzcG9uc2USRQoLZXh0cmFfdXNhZ2UYASABKAsyMC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRXh0cmFVc2FnZVN0YXR1cyLOAQoWUHVyY2hhc2VDcmVkaXRzUmVxdWVzdBIkChJhbW91bnRfbWlub3JfdW5pdHMYASABKANCCLpIBSIDKPQDEhYKCWJ1bmRsZV9pZBgCIAEoCUgAiAEBEicKGmV4cGVjdGVkX3ByaWNlX21pbm9yX3VuaXRzGAMgASgDSAGIAQESIAoMcmVkaXJlY3RfdXJsGAQgASgJQgq6SAdyBRABGIAQQgwKCl9idW5kbGVfaWRCHQobX2V4cGVjdGVkX3ByaWNlX21pbm9yX3VuaXRzIsIBChdQdXJjaGFzZUNyZWRpdHNSZXNwb25zZRJGCg5wYXltZW50X3N0YXR1cxgBIAEoDjIuLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5QdXJjaGFzZVN0YXR1cxITCgtwdXJjaGFzZV9pZBgCIAEoCRIpChxwYXltZW50X2ludGVudF9jbGllbnRfc2VjcmV0GAMgASgJSACIAQFCHwodX3BheW1lbnRfaW50ZW50X2NsaWVudF9zZWNyZXQiOAoYR2V0UHVyY2hhc2VTdGF0dXNSZXF1ZXN0EhwKC3B1cmNoYXNlX2lkGAEgASgJQge6SARyAhABIqcBChlHZXRQdXJjaGFzZVN0YXR1c1Jlc3BvbnNlEj4KBnN0YXR1cxgBIAEoDjIuLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5QdXJjaGFzZVN0YXR1cxIpChxwYXltZW50X2ludGVudF9jbGllbnRfc2VjcmV0GAIgASgJSACIAQFCHwodX3BheW1lbnRfaW50ZW50X2NsaWVudF9zZWNyZXQiOgoZQ3JlYXRlQWRtaW5SZXF1ZXN0UmVxdWVzdBIdCgxyZXF1ZXN0X3R5cGUYASABKAlCB7pIBHICEAEiMAoaQ3JlYXRlQWRtaW5SZXF1ZXN0UmVzcG9uc2USEgoKcmVxdWVzdF9pZBgBIAEoCSIYChZMaXN0RXhwZXJpZW5jZXNSZXF1ZXN0IpoBChdMaXN0RXhwZXJpZW5jZXNSZXNwb25zZRI/CgtleHBlcmllbmNlcxgBIAMoCzIqLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5FeHBlcmllbmNlEj4KBXJ1bGVzGAIgASgLMi8uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkV4cGVyaWVuY2VSdWxlcyKiAgoKRXhwZXJpZW5jZRIKCgJpZBgBIAEoCRILCgNrZXkYAiABKAkSGQoMY29udGVudF9qc29uGAMgASgJSACIAQESFQoNcGxhY2VtZW50X2tleRgEIAEoCRIZCgx0ZW1wbGF0ZV9rZXkYBSABKAlIAYgBARIPCgdlbmFibGVkGAYgASgIEhgKC3ZhcmlhbnRfa2V5GAcgASgJSAKIAQESEwoGZXhwX2lkGAggASgJSAOIAQESFQoNYWxsb3dlZF9wYXRocxgJIAMoCRIRCgR0aWVyGAogASgJSASIAQFCDwoNX2NvbnRlbnRfanNvbkIPCg1fdGVtcGxhdGVfa2V5Qg4KDF92YXJpYW50X2tleUIJCgdfZXhwX2lkQgcKBV90aWVyItMDCg9FeHBlcmllbmNlUnVsZXMSSQoGZ2xvYmFsGAEgASgLMjkuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkV4cGVyaWVuY2VDb250cm9sbGVyUnVsZXMSUwoKcGxhY2VtZW50cxgCIAMoCzI/LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5FeHBlcmllbmNlUnVsZXMuUGxhY2VtZW50c0VudHJ5EkkKBXRpZXJzGAMgAygLMjouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkV4cGVyaWVuY2VSdWxlcy5UaWVyc0VudHJ5GmwKD1BsYWNlbWVudHNFbnRyeRILCgNrZXkYASABKAkSSAoFdmFsdWUYAiABKAsyOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRXhwZXJpZW5jZUNvbnRyb2xsZXJSdWxlczoCOAEaZwoKVGllcnNFbnRyeRILCgNrZXkYASABKAkSSAoFdmFsdWUYAiABKAsyOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRXhwZXJpZW5jZUNvbnRyb2xsZXJSdWxlczoCOAEiqgEKGUV4cGVyaWVuY2VDb250cm9sbGVyUnVsZXMSRwoKcmF0ZV9saW1pdBgBIAEoCzIzLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5FeHBlcmllbmNlUmF0ZUxpbWl0EkQKCGNvb2xkb3duGAIgASgLMjIuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkV4cGVyaWVuY2VDb29sZG93biI7ChNFeHBlcmllbmNlUmF0ZUxpbWl0EhEKCXJlbWFpbmluZxgBIAEoBRIRCglyZXNldHNfYXQYAiABKAMiJQoSRXhwZXJpZW5jZUNvb2xkb3duEg8KB3NlY29uZHMYASABKAUiwQEKFlRyYWNrRXhwZXJpZW5jZVJlcXVlc3QSHwoNZXhwZXJpZW5jZV9pZBgBIAEoCUIIukgFcgOwAQESGQoGYWN0aW9uGAIgASgJQgm6SAZyBBABGEASIgoLdmFyaWFudF9rZXkYAyABKAlCCLpIBXIDGIACSACIAQESJQoNbWV0YWRhdGFfanNvbhgEIAEoCUIJukgGcgQYgIABSAGIAQFCDgoMX3ZhcmlhbnRfa2V5QhAKDl9tZXRhZGF0YV9qc29uIioKF1RyYWNrRXhwZXJpZW5jZVJlc3BvbnNlEg8KB3N1Y2Nlc3MYASABKAgilQEKHkV4ZWN1dGVFeHBlcmllbmNlQWN0aW9uUmVxdWVzdBIfCg1leHBlcmllbmNlX2lkGAEgASgJQgi6SAVyA7ABARIdCglhY3Rpb25faWQYAiABKAlCCrpIB3IFEAEYgAISIwoLcGFyYW1zX2pzb24YAyABKAlCCbpIBnIEGICAAUgAiAEBQg4KDF9wYXJhbXNfanNvbiI3Ch9FeGVjdXRlRXhwZXJpZW5jZUFjdGlvblJlc3BvbnNlEhQKDGFjdGlvbnNfanNvbhgBIAEoCSIfCh1HZXRSZWZlcnJhbEVsaWdpYmlsaXR5UmVxdWVzdCLEAQoeR2V0UmVmZXJyYWxFbGlnaWJpbGl0eVJlc3BvbnNlEhAKCGVsaWdpYmxlGAEgASgIEhcKCnNoYXJlX2xpbmsYAiABKAlIAIgBARIWCglyZW1haW5pbmcYAyABKAVIAYgBARISCgVsaW1pdBgEIAEoBUgCiAEBEhYKCXRlcm1zX3VybBgFIAEoCUgDiAEBQg0KC19zaGFyZV9saW5rQgwKCl9yZW1haW5pbmdCCAoGX2xpbWl0QgwKCl90ZXJtc191cmwitQMKB1NoYXJpbmcSEQoJdmlld19tb2RlGAEgASgJEhUKDXRlYW1fY2FuX2VkaXQYAiABKAgSGAoQdGVhbV9jYW5fY29tbWVudBgDIAEoCBI8CgVzY29wZRgEIAEoDjItLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5TaGFyaW5nLlNjb3BlEk8KD2xpbmtfcGVybWlzc2lvbhgFIAEoDjI2LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5TaGFyaW5nLkxpbmtQZXJtaXNzaW9uIlIKBVNjb3BlEhUKEVNDT1BFX1VOU1BFQ0lGSUVEEAASEQoNU0NPUEVfSU5WSVRFRBABEg0KCVNDT1BFX09SRxACEhAKDFNDT1BFX1BVQkxJQxADIoIBCg5MaW5rUGVybWlzc2lvbhIfChtMSU5LX1BFUk1JU1NJT05fVU5TUEVDSUZJRUQQABIYChRMSU5LX1BFUk1JU1NJT05fVklFVxABEhsKF0xJTktfUEVSTUlTU0lPTl9DT01NRU5UEAISGAoUTElOS19QRVJNSVNTSU9OX0VESVQQAyK7AQoNUHJvamVjdE1lbWJlchIUCgxhY2NvdW50X3V1aWQYASABKAkSDQoFZW1haWwYAiABKAkSFAoMZGlzcGxheV9uYW1lGAMgASgJEj8KBHJvbGUYBCABKA4yMS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRGVzaWduUHJvamVjdFJvbGUSLgoKZ3JhbnRlZF9hdBgFIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXAiRgoMUHJvamVjdFNraWxsEgwKBG5hbWUYASABKAkSDgoGcHJvbXB0GAIgASgJEhgKEGludHJvZHVjdG9yeV9tc2cYAyABKAkigQcKD1Byb2plY3RMaXN0SXRlbRISCgpwcm9qZWN0X2lkGAEgASgJEgwKBG5hbWUYAiABKAkSLQoJdmlld2VkX2F0GAMgASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcBISCgpvd25lcl91dWlkGAQgASgJEhMKC293bmVyX2VtYWlsGAUgASgJEhAKCGlzX293bmVkGAYgASgIEjgKB3NoYXJpbmcYByABKAsyJy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU2hhcmluZxI5CgR0eXBlGAggASgOMisuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlByb2plY3RUeXBlEjAKDHB1Ymxpc2hlZF9hdBgJIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXASGwoOdGVtcGxhdGVfdGl0bGUYCiABKAlIAIgBARIYCgtkZXNjcmlwdGlvbhgLIAEoCUgBiAEBEhcKCmludHJvX3RleHQYDCABKAlIAogBARIgChNzb3VyY2VfcHJvamVjdF91dWlkGA0gASgJSAOIAQESLgoKdXBkYXRlZF9hdBgOIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXASGgoSb3duZXJfZGlzcGxheV9uYW1lGA8gASgJEhMKC2lzX2Zhdm9yaXRlGBEgASgIEhAKCGNhbl9lZGl0GBIgASgIEksKDmRlc2lnbl9zeXN0ZW1zGBMgAygLMjMuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlc2lnblN5c3RlbUJpbmRpbmcSGQoRb3JnYW5pemF0aW9uX3V1aWQYFCABKAkSHAoPY2FsbGVyX2Nhbl9lZGl0GBUgASgISASIAQESHgoRY2FsbGVyX2Nhbl9kZWxldGUYFiABKAhIBYgBARIfChJjYWxsZXJfY2FuX3B1Ymxpc2gYFyABKAhIBogBAUIRCg9fdGVtcGxhdGVfdGl0bGVCDgoMX2Rlc2NyaXB0aW9uQg0KC19pbnRyb190ZXh0QhYKFF9zb3VyY2VfcHJvamVjdF91dWlkQhIKEF9jYWxsZXJfY2FuX2VkaXRCFAoSX2NhbGxlcl9jYW5fZGVsZXRlQhUKE19jYWxsZXJfY2FuX3B1Ymxpc2hKBAgQEBEiQAoTTGlzdFByb2plY3RzUmVxdWVzdBIOCgZjdXJzb3IYASABKAkSDgoGZmlsdGVyGAIgASgJEgkKAXEYAyABKAkiZgoUTGlzdFByb2plY3RzUmVzcG9uc2USPgoFaXRlbXMYASADKAsyLy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUHJvamVjdExpc3RJdGVtEg4KBmN1cnNvchgCIAEoCSLTBQoUQ3JlYXRlUHJvamVjdFJlcXVlc3QSFgoEbmFtZRgBIAEoCUIIukgFcgMY/wESPAoGc2tpbGxzGAIgAygLMiwuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlByb2plY3RTa2lsbBJDCgR0eXBlGAMgASgOMisuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlByb2plY3RUeXBlQgi6SAWCAQIQARIlCg50ZW1wbGF0ZV90aXRsZRgEIAEoCUIIukgFcgMY/wFIAIgBARIiCgtkZXNjcmlwdGlvbhgFIAEoCUIIukgFcgMY0A9IAYgBARIhCgppbnRyb190ZXh0GAYgASgJQgi6SAVyAxjQD0gCiAEBEiEKC291dHB1dF90eXBlGAcgASgJQge6SARyAhhASAOIAQESIwoWdXNlZF9vcmdfZGVzaWduX3N5c3RlbRgIIAEoCEgEiAEBEiIKC3RlbXBsYXRlX2lkGAkgASgJQgi6SAVyAxj/AUgFiAEBEicKEGRlc2lnbl9zeXN0ZW1faWQYCiABKAlCCLpIBXIDGP8BSAaIAQESVQoOZGVzaWduX3N5c3RlbXMYCyADKAsyMy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRGVzaWduU3lzdGVtQmluZGluZ0IIukgFkgECEBASJgoZZGVzaWduX2NvbXBvbmVudHNfZW5hYmxlZBgMIAEoCEgHiAEBQhEKD190ZW1wbGF0ZV90aXRsZUIOCgxfZGVzY3JpcHRpb25CDQoLX2ludHJvX3RleHRCDgoMX291dHB1dF90eXBlQhkKF191c2VkX29yZ19kZXNpZ25fc3lzdGVtQg4KDF90ZW1wbGF0ZV9pZEITChFfZGVzaWduX3N5c3RlbV9pZEIcChpfZGVzaWduX2NvbXBvbmVudHNfZW5hYmxlZCI5ChVDcmVhdGVQcm9qZWN0UmVzcG9uc2USEgoKcHJvamVjdF9pZBgBIAEoCRIMCgRkYXRhGAIgASgMIjEKEUdldFByb2plY3RSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBIo8IChJHZXRQcm9qZWN0UmVzcG9uc2USEgoKcHJvamVjdF9pZBgBIAEoCRIMCgRuYW1lGAIgASgJEhIKCm93bmVyX3V1aWQYAyABKAkSEwoLb3duZXJfZW1haWwYBCABKAkSLgoKY3JlYXRlZF9hdBgFIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXASLgoKdXBkYXRlZF9hdBgGIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXASOAoHc2hhcmluZxgHIAEoCzInLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5TaGFyaW5nEgwKBGRhdGEYCSABKAwSOQoEdHlwZRgKIAEoDjIrLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Qcm9qZWN0VHlwZRIwCgxwdWJsaXNoZWRfYXQYCyABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEhsKDnRlbXBsYXRlX3RpdGxlGAwgASgJSACIAQESGAoLZGVzY3JpcHRpb24YDSABKAlIAYgBARIXCgppbnRyb190ZXh0GA4gASgJSAKIAQESIAoTc291cmNlX3Byb2plY3RfdXVpZBgPIAEoCUgDiAEBEhYKCWNsYXVkZV9tZBgQIAEoCUgEiAEBEh8KF2hhc19jbGF1ZGVfY29kZV9zZXNzaW9uGBEgASgIEhoKEm93bmVyX2Rpc3BsYXlfbmFtZRgSIAEoCRJLCg5kZXNpZ25fc3lzdGVtcxgTIAMoCzIzLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5EZXNpZ25TeXN0ZW1CaW5kaW5nEhcKD2NhbGxlcl9jYW5fZWRpdBgUIAEoCBIaChJjYWxsZXJfY2FuX2NvbW1lbnQYFSABKAgSIQoZY2FsbGVyX2Nhbl9tYW5hZ2VfbWVtYmVycxgWIAEoCBJQChVjYWxsZXJfZWZmZWN0aXZlX3JvbGUYFyABKA4yMS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRGVzaWduUHJvamVjdFJvbGUSHAoUY2FsbGVyX2Nhbl9zZWVfY2hhdHMYGCABKAgSGQoRY2FsbGVyX2Nhbl9kZWxldGUYGSABKAgSGgoSY2FsbGVyX2Nhbl9wdWJsaXNoGBogASgIEh8KF2NhbGxlcl9jYW5fc2hhcmVfdG9fb3JnGBsgASgIQhEKD190ZW1wbGF0ZV90aXRsZUIOCgxfZGVzY3JpcHRpb25CDQoLX2ludHJvX3RleHRCFgoUX3NvdXJjZV9wcm9qZWN0X3V1aWRCDAoKX2NsYXVkZV9tZEoECAgQCVIHdHJ1c3RlZCKkAQoeQ3JlYXRlQ2xhdWRlQ29kZVNlc3Npb25SZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEiMKDGluc3RydWN0aW9ucxgCIAEoCUIIukgFcgMY0A9IAIgBARIgCglvcGVuX2ZpbGUYAyABKAlCCLpIBXIDGIAISAGIAQFCDwoNX2luc3RydWN0aW9uc0IMCgpfb3Blbl9maWxlIlsKH0NyZWF0ZUNsYXVkZUNvZGVTZXNzaW9uUmVzcG9uc2USEgoKc2Vzc2lvbl9pZBgBIAEoCRITCgtzZXNzaW9uX3VybBgCIAEoCRIPCgdyZXN1bWVkGAMgASgIImMKFFVwZGF0ZVByb2plY3RSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEhEKBG5hbWUYAiABKAlIAIgBAUIHCgVfbmFtZUoECAMQBFILbGFzdF9vcGVuZWQiFwoVVXBkYXRlUHJvamVjdFJlc3BvbnNlIp8BChREZWxldGVQcm9qZWN0UmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIdChBvbmx5X2lmX3ByaXN0aW5lGAIgASgISACIAQESIwoNZGVsZXRlX3JlYXNvbhgDIAEoCUIHukgEcgIYQEgBiAEBQhMKEV9vbmx5X2lmX3ByaXN0aW5lQhAKDl9kZWxldGVfcmVhc29uIhcKFURlbGV0ZVByb2plY3RSZXNwb25zZSI1ChVHZXRQcm9qZWN0RGF0YVJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQEiJgoWR2V0UHJvamVjdERhdGFSZXNwb25zZRIMCgRkYXRhGAEgASgMIk4KGFVwZGF0ZVByb2plY3REYXRhUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIUCgRkYXRhGAIgASgMQga6SAPIAQEiNwoZVXBkYXRlUHJvamVjdERhdGFSZXNwb25zZRIaChJzeW5jX2ludGVydmFsX2hpbnQYASABKAUiggEKEUltcG9ydENoYXRSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEhcKBXRpdGxlGAIgASgJQgi6SAVyAxj/ARIdCghtZXNzYWdlcxgDIAMoDEILukgIkgEFCAEQ9AMSFwoGc291cmNlGAQgASgJQge6SARyAhhAIiUKEkltcG9ydENoYXRSZXNwb25zZRIPCgdjaGF0X2lkGAEgASgJIkwKEURlbGV0ZUNoYXRSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEhkKB2NoYXRfaWQYAiABKAlCCLpIBXIDsAEBIhQKEkRlbGV0ZUNoYXRSZXNwb25zZSLzAgoUVXBkYXRlU2hhcmluZ1JlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESFgoJdmlld19tb2RlGAIgASgJSACIAQESGgoNdGVhbV9jYW5fZWRpdBgDIAEoCEgBiAEBEh0KEHRlYW1fY2FuX2NvbW1lbnQYBCABKAhIAogBARJBCgVzY29wZRgFIAEoDjItLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5TaGFyaW5nLlNjb3BlSAOIAQESVAoPbGlua19wZXJtaXNzaW9uGAYgASgOMjYuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlNoYXJpbmcuTGlua1Blcm1pc3Npb25IBIgBAUIMCgpfdmlld19tb2RlQhAKDl90ZWFtX2Nhbl9lZGl0QhMKEV90ZWFtX2Nhbl9jb21tZW50QggKBl9zY29wZUISChBfbGlua19wZXJtaXNzaW9uIlEKFVVwZGF0ZVNoYXJpbmdSZXNwb25zZRI4CgdzaGFyaW5nGAEgASgLMicuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlNoYXJpbmciOQoZTGlzdFByb2plY3RNZW1iZXJzUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABASJcChpMaXN0UHJvamVjdE1lbWJlcnNSZXNwb25zZRI+CgdtZW1iZXJzGAEgAygLMi0uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlByb2plY3RNZW1iZXIiOQoZR2V0UHJvamVjdFByZXNlbmNlUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABASI9Cg9QcmVzZW5jZUFjY291bnQSFAoMYWNjb3VudF91dWlkGAEgASgJEhQKDGRpc3BsYXlfbmFtZRgCIAEoCSJfChpHZXRQcm9qZWN0UHJlc2VuY2VSZXNwb25zZRJBCghhY2NvdW50cxgBIAMoCzIvLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5QcmVzZW5jZUFjY291bnQipAEKF0FkZFByb2plY3RNZW1iZXJSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEh4KDGFjY291bnRfdXVpZBgCIAEoCUIIukgFcgOwAQESSwoEcm9sZRgDIAEoDjIxLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5EZXNpZ25Qcm9qZWN0Um9sZUIKukgHggEEEAEgACJZChhBZGRQcm9qZWN0TWVtYmVyUmVzcG9uc2USPQoGbWVtYmVyGAEgASgLMi0uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlByb2plY3RNZW1iZXIiqwEKHlVwZGF0ZVByb2plY3RNZW1iZXJSb2xlUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIeCgxhY2NvdW50X3V1aWQYAiABKAlCCLpIBXIDsAEBEksKBHJvbGUYAyABKA4yMS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRGVzaWduUHJvamVjdFJvbGVCCrpIB4IBBBABIAAiYAofVXBkYXRlUHJvamVjdE1lbWJlclJvbGVSZXNwb25zZRI9CgZtZW1iZXIYASABKAsyLS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUHJvamVjdE1lbWJlciJaChpSZW1vdmVQcm9qZWN0TWVtYmVyUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIeCgxhY2NvdW50X3V1aWQYAiABKAlCCLpIBXIDsAEBIh0KG1JlbW92ZVByb2plY3RNZW1iZXJSZXNwb25zZSIyChdTZWFyY2hPcmdNZW1iZXJzUmVxdWVzdBIXCgVxdWVyeRgBIAEoCUIIukgFcgMYgAIiVgoYU2VhcmNoT3JnTWVtYmVyc1Jlc3BvbnNlEjoKB21lbWJlcnMYASADKAsyKS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuT3JnTWVtYmVyIkYKCU9yZ01lbWJlchIUCgxhY2NvdW50X3V1aWQYASABKAkSDQoFZW1haWwYAiABKAkSFAoMZGlzcGxheV9uYW1lGAMgASgJIjcKF0R1cGxpY2F0ZVByb2plY3RSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBIi4KGER1cGxpY2F0ZVByb2plY3RSZXNwb25zZRISCgpwcm9qZWN0X2lkGAEgASgJIkoKE1JlbWl4UHJvamVjdFJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESFQoNaW5jbHVkZV9jaGF0cxgCIAEoCCIqChRSZW1peFByb2plY3RSZXNwb25zZRISCgpwcm9qZWN0X2lkGAEgASgJIp0BChpTZXRQcm9qZWN0VGh1bWJuYWlsUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIlChJ0aHVtYm5haWxfZGF0YV91cmwYAiABKAlCCbpIBnIEKJChDxImCg90ZW1wbGF0ZV9mb2xkZXIYAyABKAlCCLpIBXIDKIACSACIAQFCEgoQX3RlbXBsYXRlX2ZvbGRlciIdChtTZXRQcm9qZWN0VGh1bWJuYWlsUmVzcG9uc2UiZwoXTWludFByZXZpZXdUb2tlblJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESGwoJZmlsZV9wYXRoGAMgASgJQgi6SAVyAxiACEoECAIQA1ILbWF4X2ZldGNoZXMiTQoYTWludFByZXZpZXdUb2tlblJlc3BvbnNlEg4KBm9yaWdpbhgBIAEoCRINCgV0b2tlbhgCIAEoCRISCgpleHBpcmVzX2F0GAMgASgDIlQKFEJ1bmRsZVByb2plY3RSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEh4KCmFzc2V0X3BhdGgYAiABKAlCCrpIB3IFEAEYgAgiaAoVQnVuZGxlUHJvamVjdFJlc3BvbnNlEgsKA3VybBgBIAEoCRISCgpzaXplX2J5dGVzGAIgASgDEi4KCmV4cGlyZXNfYXQYAyABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wIk4KF01pbnRIYW5kb2ZmVG9rZW5SZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEhUKDWluY2x1ZGVfY2hhdHMYAiABKAgiPQoYTWludEhhbmRvZmZUb2tlblJlc3BvbnNlEg0KBXRva2VuGAEgASgJEhIKCmV4cGlyZXNfYXQYAiABKAMi4QUKB0NvbW1lbnQSEgoKY29tbWVudF9pZBgBIAEoCRISCgpwcm9qZWN0X2lkGAIgASgJEhsKE2F1dGhvcl9hY2NvdW50X3V1aWQYAyABKAkSGwoTYXV0aG9yX2Rpc3BsYXlfbmFtZRgEIAEoCRIMCgRib2R5GAUgASgJEhYKCWZpbGVfcGF0aBgGIAEoCUgAiAEBEh0KEGVsZW1lbnRfc2VsZWN0b3IYByABKAlIAYgBARIfChJlbGVtZW50X2Rlc2NyaXB0b3IYCCABKAlIAogBARIdChBmaWxlX2NvbnRlbnRfc2hhGAkgASgJSAOIAQESGQoRcXVldWVkX2Zvcl9jbGF1ZGUYCiABKAgSNAoLcmVzb2x2ZWRfYXQYCyABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wSASIAQESHQoQcmVzb2x2ZWRfYnlfdXVpZBgMIAEoCUgFiAEBEhwKD3NlbnRfdG9fY2hhdF9pZBgNIAEoCUgGiAEBEi4KCmNyZWF0ZWRfYXQYDiABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEi4KCnVwZGF0ZWRfYXQYDyABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEj0KB3JlcGxpZXMYECADKAsyLC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ29tbWVudFJlcGx5EhIKBXBpbl94GBEgASgBSAeIAQESEgoFcGluX3kYEiABKAFICIgBAUIMCgpfZmlsZV9wYXRoQhMKEV9lbGVtZW50X3NlbGVjdG9yQhUKE19lbGVtZW50X2Rlc2NyaXB0b3JCEwoRX2ZpbGVfY29udGVudF9zaGFCDgoMX3Jlc29sdmVkX2F0QhMKEV9yZXNvbHZlZF9ieV91dWlkQhIKEF9zZW50X3RvX2NoYXRfaWRCCAoGX3Bpbl94QggKBl9waW5feSKsAQoMQ29tbWVudFJlcGx5EhAKCHJlcGx5X2lkGAEgASgJEhIKCmNvbW1lbnRfaWQYAiABKAkSGwoTYXV0aG9yX2FjY291bnRfdXVpZBgDIAEoCRIbChNhdXRob3JfZGlzcGxheV9uYW1lGAQgASgJEgwKBGJvZHkYBSABKAkSLgoKY3JlYXRlZF9hdBgGIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXAiMwoTTGlzdENvbW1lbnRzUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABASKhAQoUTGlzdENvbW1lbnRzUmVzcG9uc2USOQoIY29tbWVudHMYASADKAsyJy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ29tbWVudBI5ChBjb21tZW50c19yZWFkX2F0GAIgASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcEgAiAEBQhMKEV9jb21tZW50c19yZWFkX2F0IsUDChRDcmVhdGVDb21tZW50UmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIYCgRib2R5GAIgASgJQgq6SAdyBRABGJBOEiAKCWZpbGVfcGF0aBgDIAEoCUIIukgFcgMYgAhIAIgBARInChBlbGVtZW50X3NlbGVjdG9yGAQgASgJQgi6SAVyAxiAIEgBiAEBEikKEmVsZW1lbnRfZGVzY3JpcHRvchgFIAEoCUIIukgFcgMYgEBIAogBARInChBmaWxlX2NvbnRlbnRfc2hhGAYgASgJQgi6SAVyAxiAAUgDiAEBEhkKEXF1ZXVlZF9mb3JfY2xhdWRlGAcgASgIEisKBXBpbl94GAggASgBQhe6SBQSEhkAAAAAAADwPykAAAAAAAAAAEgEiAEBEisKBXBpbl95GAkgASgBQhe6SBQSEhkAAAAAAADwPykAAAAAAAAAAEgFiAEBQgwKCl9maWxlX3BhdGhCEwoRX2VsZW1lbnRfc2VsZWN0b3JCFQoTX2VsZW1lbnRfZGVzY3JpcHRvckITChFfZmlsZV9jb250ZW50X3NoYUIICgZfcGluX3hCCAoGX3Bpbl95IlEKFUNyZWF0ZUNvbW1lbnRSZXNwb25zZRI4Cgdjb21tZW50GAEgASgLMicuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNvbW1lbnQiwgMKFFVwZGF0ZUNvbW1lbnRSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEhwKCmNvbW1lbnRfaWQYAiABKAlCCLpIBXIDsAEBEh0KBGJvZHkYAyABKAlCCrpIB3IFEAEYkE5IAIgBARIVCghyZXNvbHZlZBgEIAEoCEgBiAEBEh4KEXF1ZXVlZF9mb3JfY2xhdWRlGAUgASgISAKIAQESKwoFcGluX3gYBiABKAFCF7pIFBISGQAAAAAAAPA/KQAAAAAAAAAASAOIAQESKwoFcGluX3kYByABKAFCF7pIFBISGQAAAAAAAPA/KQAAAAAAAAAASASIAQESJwoQZWxlbWVudF9zZWxlY3RvchgIIAEoCUIIukgFcgMYgCBIBYgBARIpChJlbGVtZW50X2Rlc2NyaXB0b3IYCSABKAlCCLpIBXIDGIBASAaIAQFCBwoFX2JvZHlCCwoJX3Jlc29sdmVkQhQKEl9xdWV1ZWRfZm9yX2NsYXVkZUIICgZfcGluX3hCCAoGX3Bpbl95QhMKEV9lbGVtZW50X3NlbGVjdG9yQhUKE19lbGVtZW50X2Rlc2NyaXB0b3IiUQoVVXBkYXRlQ29tbWVudFJlc3BvbnNlEjgKB2NvbW1lbnQYASABKAsyJy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ29tbWVudCJSChREZWxldGVDb21tZW50UmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIcCgpjb21tZW50X2lkGAIgASgJQgi6SAVyA7ABASIXChVEZWxldGVDb21tZW50UmVzcG9uc2UicQoZQ3JlYXRlQ29tbWVudFJlcGx5UmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIcCgpjb21tZW50X2lkGAIgASgJQgi6SAVyA7ABARIYCgRib2R5GAMgASgJQgq6SAdyBRABGJBOIlkKGkNyZWF0ZUNvbW1lbnRSZXBseVJlc3BvbnNlEjsKBXJlcGx5GAEgASgLMiwuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNvbW1lbnRSZXBseSJzChlEZWxldGVDb21tZW50UmVwbHlSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEhwKCmNvbW1lbnRfaWQYAiABKAlCCLpIBXIDsAEBEhoKCHJlcGx5X2lkGAMgASgJQgi6SAVyA7ABASIcChpEZWxldGVDb21tZW50UmVwbHlSZXNwb25zZSKNAQoZVXBkYXRlQ29tbWVudFJlcGx5UmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIcCgpjb21tZW50X2lkGAIgASgJQgi6SAVyA7ABARIaCghyZXBseV9pZBgDIAEoCUIIukgFcgOwAQESGAoEYm9keRgEIAEoCUIKukgHcgUQARiQTiJZChpVcGRhdGVDb21tZW50UmVwbHlSZXNwb25zZRI7CgVyZXBseRgBIAEoCzIsLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Db21tZW50UmVwbHkifAoZU2VuZENvbW1lbnRzVG9DaGF0UmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARImCgtjb21tZW50X2lkcxgCIAMoCUIRukgOkgELCAEQZCIFcgOwAQESGQoHY2hhdF9pZBgDIAEoCUIIukgFcgOwAQEiOAoaU2VuZENvbW1lbnRzVG9DaGF0UmVzcG9uc2USGgoSbWFya2VkX2NvbW1lbnRfaWRzGAEgAygJIjcKF01hcmtDb21tZW50c1JlYWRSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBIlAKGE1hcmtDb21tZW50c1JlYWRSZXNwb25zZRI0ChBjb21tZW50c19yZWFkX2F0GAEgASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcCJ/ChhVcGRhdGVQcm9qZWN0VHlwZVJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESRQoEdHlwZRgCIAEoDjIrLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Qcm9qZWN0VHlwZUIKukgHggEEEAEgACJWChlVcGRhdGVQcm9qZWN0VHlwZVJlc3BvbnNlEjkKBHR5cGUYASABKA4yKy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUHJvamVjdFR5cGUiQAogQ3JlYXRlVGVtcGxhdGVGcm9tUHJvamVjdFJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQEiNwohQ3JlYXRlVGVtcGxhdGVGcm9tUHJvamVjdFJlc3BvbnNlEhIKCnByb2plY3RfaWQYASABKAkiTQoaU2V0UHJvamVjdFB1Ymxpc2hlZFJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESEQoJcHVibGlzaGVkGAIgASgIIk8KG1NldFByb2plY3RQdWJsaXNoZWRSZXNwb25zZRIwCgxwdWJsaXNoZWRfYXQYASABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wItgBChhVcGRhdGVQcm9qZWN0SW5mb1JlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESJQoOdGVtcGxhdGVfdGl0bGUYAiABKAlCCLpIBXIDGP8BSACIAQESIgoLZGVzY3JpcHRpb24YAyABKAlCCLpIBXIDGNAPSAGIAQESIQoKaW50cm9fdGV4dBgEIAEoCUIIukgFcgMY0A9IAogBAUIRCg9fdGVtcGxhdGVfdGl0bGVCDgoMX2Rlc2NyaXB0aW9uQg0KC19pbnRyb190ZXh0IhsKGVVwZGF0ZVByb2plY3RJbmZvUmVzcG9uc2UicQoTRGVzaWduU3lzdGVtQmluZGluZxIfCg1kc19wcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIiChFzeW5jZWRfYXRfdmVyc2lvbhgCIAEoA0IHukgEIgIoABIVCg1oYXNfdjJfbGF5b3V0GAMgASgIIpgBCiFVcGRhdGVQcm9qZWN0RGVzaWduU3lzdGVtc1JlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESVQoOZGVzaWduX3N5c3RlbXMYAiADKAsyMy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRGVzaWduU3lzdGVtQmluZGluZ0IIukgFkgECEBAicQoiVXBkYXRlUHJvamVjdERlc2lnblN5c3RlbXNSZXNwb25zZRJLCg5kZXNpZ25fc3lzdGVtcxgBIAMoCzIzLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5EZXNpZ25TeXN0ZW1CaW5kaW5nImAKH1JlZnJlc2hCb3VuZERlc2lnblN5c3RlbVJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESHwoNZHNfcHJvamVjdF9pZBgCIAEoCUIIukgFcgOwAQEiNQogUmVmcmVzaEJvdW5kRGVzaWduU3lzdGVtUmVzcG9uc2USEQoJcmVmcmVzaGVkGAEgASgFInIKEExpbnRGaWxlc1JlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESIAoLY29uZmlnX2pzb24YAiABKAxCC7pICHoGEAIYgIAQEh4KDGluY2x1ZGVfZXh0cxgDIAMoCUIIukgFkgECEAgibQoLTGludEZpbmRpbmcSDAoEcGF0aBgBIAEoCRIMCgRsaW5lGAIgASgFEg4KBmNvbHVtbhgDIAEoBRIPCgdydWxlX2lkGAQgASgJEhAKCHNldmVyaXR5GAUgASgJEg8KB21lc3NhZ2UYBiABKAkiaAoRTGludEZpbGVzUmVzcG9uc2USPQoIZmluZGluZ3MYASADKAsyKy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTGludEZpbmRpbmcSFAoMZmlsZXNfbGludGVkGAIgASgFIksKGVNldFByb2plY3RGYXZvcml0ZVJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESEAoIZmF2b3JpdGUYAiABKAgiHAoaU2V0UHJvamVjdEZhdm9yaXRlUmVzcG9uc2UiOAoYUmVtb3ZlRnJvbVJlY2VudHNSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBIhsKGVJlbW92ZUZyb21SZWNlbnRzUmVzcG9uc2UihwEKFkxpc3RPcmdQcm9qZWN0c1JlcXVlc3QSRQoEdHlwZRgBIAEoDjIrLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Qcm9qZWN0VHlwZUIKukgHggEEEAEgABIWCg5wdWJsaXNoZWRfb25seRgCIAEoCBIOCgZjdXJzb3IYAyABKAkiaQoXTGlzdE9yZ1Byb2plY3RzUmVzcG9uc2USPgoFaXRlbXMYASADKAsyLy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUHJvamVjdExpc3RJdGVtEg4KBmN1cnNvchgCIAEoCSIXChVHZXRPcmdTZXR0aW5nc1JlcXVlc3QioAEKFkdldE9yZ1NldHRpbmdzUmVzcG9uc2USLwoiZGVmYXVsdF9kZXNpZ25fc3lzdGVtX3Byb2plY3RfdXVpZBgBIAEoCUgAiAEBEi4KCnVwZGF0ZWRfYXQYAiABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wQiUKI19kZWZhdWx0X2Rlc2lnbl9zeXN0ZW1fcHJvamVjdF91dWlkInIKGFVwZGF0ZU9yZ1NldHRpbmdzUmVxdWVzdBIvCiJkZWZhdWx0X2Rlc2lnbl9zeXN0ZW1fcHJvamVjdF91dWlkGAEgASgJSACIAQFCJQojX2RlZmF1bHRfZGVzaWduX3N5c3RlbV9wcm9qZWN0X3V1aWQiGwoZVXBkYXRlT3JnU2V0dGluZ3NSZXNwb25zZSIYChZHZXRVc2VyU2V0dGluZ3NSZXF1ZXN0IsMBChdHZXRVc2VyU2V0dGluZ3NSZXNwb25zZRI8ChhhZ2VudF9kZXNpZ25fcHJvamVjdHNfYXQYASABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEjoKFmFnZW50X29yZ19kaXJlY3RvcnlfYXQYAiABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEi4KCnVwZGF0ZWRfYXQYAyABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wIpMBChlVcGRhdGVVc2VyU2V0dGluZ3NSZXF1ZXN0EiIKFWFnZW50X2Rlc2lnbl9wcm9qZWN0cxgBIAEoCEgAiAEBEiAKE2FnZW50X29yZ19kaXJlY3RvcnkYAiABKAhIAYgBAUIYChZfYWdlbnRfZGVzaWduX3Byb2plY3RzQhYKFF9hZ2VudF9vcmdfZGlyZWN0b3J5IsYBChpVcGRhdGVVc2VyU2V0dGluZ3NSZXNwb25zZRI8ChhhZ2VudF9kZXNpZ25fcHJvamVjdHNfYXQYASABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEjoKFmFnZW50X29yZ19kaXJlY3RvcnlfYXQYAiABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEi4KCnVwZGF0ZWRfYXQYAyABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wIqsBCglGaWxlRW50cnkSDAoEbmFtZRgBIAEoCRIMCgRwYXRoGAIgASgJEgwKBHR5cGUYAyABKAkSDAoEc2l6ZRgEIAEoAxIUCgxjb250ZW50X3R5cGUYBSABKAkSLgoKdXBkYXRlZF9hdBgGIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXASFAoHdmVyc2lvbhgHIAEoA0gAiAEBQgoKCF92ZXJzaW9uIm0KEExpc3RGaWxlc1JlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESDAoEcGF0aBgCIAEoCRINCgVkZXB0aBgDIAEoBRIOCgZvZmZzZXQYBCABKAUSDgoGZmlsdGVyGAUgASgJIpABChFMaXN0RmlsZXNSZXNwb25zZRI6CgdlbnRyaWVzGAEgAygLMikuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkZpbGVFbnRyeRINCgV0b3RhbBgCIAEoBRIOCgZvZmZzZXQYAyABKAUSDQoFbGltaXQYBCABKAUSEQoJdHJ1bmNhdGVkGAUgASgIImIKDkdldEZpbGVSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEhUKBHBhdGgYAiABKAlCB7pIBHICEAESCwoDcmF3GAMgASgIEg4KBnNyY21hcBgEIAEoCCJtCg9HZXRGaWxlUmVzcG9uc2USDwoHY29udGVudBgBIAEoDBIUCgxjb250ZW50X3R5cGUYAiABKAkSEQoJaXNfYmFzZTY0GAMgASgIEhQKB3ZlcnNpb24YBCABKANIAIgBAUIKCghfdmVyc2lvbiLJAQoLRmlsZVRvV3JpdGUSFQoEcGF0aBgBIAEoCUIHukgEcgIQARIMCgRkYXRhGAIgASgJEhEKCW1pbWVfdHlwZRgDIAEoCRIQCghlbmNvZGluZxgEIAEoCRIdChBleHBlY3RlZF92ZXJzaW9uGAUgASgDSACIAQESIgoVZXhwZWN0ZWRfY29udGVudF9oYXNoGAYgASgJSAGIAQFCEwoRX2V4cGVjdGVkX3ZlcnNpb25CGAoWX2V4cGVjdGVkX2NvbnRlbnRfaGFzaCLxAgoRV3JpdGVGaWxlc1JlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESRwoFZmlsZXMYAiADKAsyKy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRmlsZVRvV3JpdGVCCxgBukgGkgEDEPQDEhMKC2RlZHVwbGljYXRlGAMgASgIEhcKCnR1cm5fZXBvY2gYBCABKANIAIgBARIUCgdjaGF0X2lkGAUgASgJSAGIAQESJAoMZGVsZXRlX3BhdGhzGAYgAygJQg4YAbpICZIBBiIEcgIQARJKCgltdXRhdGlvbnMYByADKAsyLC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRmlsZU11dGF0aW9uQgm6SAaSAQMQ9AMSFgoJc3RyZWFtX2lkGAggASgJSAKIAQFCDQoLX3R1cm5fZXBvY2hCCgoIX2NoYXRfaWRCDAoKX3N0cmVhbV9pZCJQCgtXcml0dGVuRmlsZRIMCgRuYW1lGAEgASgJEgwKBHBhdGgYAiABKAkSFAoMY29udGVudF90eXBlGAMgASgJEg8KB3ZlcnNpb24YBCABKAMiigMKDEZpbGVNdXRhdGlvbhIVCgRwYXRoGAEgASgJQge6SARyAhABEh0KEGV4cGVjdGVkX3ZlcnNpb24YAiABKANIAYgBARIiChVleHBlY3RlZF9jb250ZW50X2hhc2gYAyABKAlIAogBARI4CgV3cml0ZRgEIAEoCzInLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Xcml0ZU9wSAASNgoEZWRpdBgFIAEoCzImLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5FZGl0T3BIABI6CgZkZWxldGUYBiABKAsyKC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRGVsZXRlT3BIABI2CgRtb3ZlGAggASgLMiYuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLk1vdmVPcEgAQgsKAm9wEgW6SAIIAUITChFfZXhwZWN0ZWRfdmVyc2lvbkIYChZfZXhwZWN0ZWRfY29udGVudF9oYXNoIjwKB1dyaXRlT3ASDAoEZGF0YRgBIAEoCRIRCgltaW1lX3R5cGUYAiABKAkSEAoIZW5jb2RpbmcYAyABKAkiWQoGRWRpdE9wEk8KDHJlcGxhY2VtZW50cxgBIAMoCzIvLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5FZGl0UmVwbGFjZW1lbnRCCLpIBZIBAggBInoKD0VkaXRSZXBsYWNlbWVudBIYCgdvbGRfc3RyGAEgASgJQge6SARyAhABEg8KB25ld19zdHIYAiABKAkSIgoVZXhwZWN0ZWRfcmVwbGFjZW1lbnRzGAMgASgFSACIAQFCGAoWX2V4cGVjdGVkX3JlcGxhY2VtZW50cyIKCghEZWxldGVPcCJiCgZNb3ZlT3ASGgoJZnJvbV9wYXRoGAEgASgJQge6SARyAhABEiIKFWZyb21fZXhwZWN0ZWRfdmVyc2lvbhgCIAEoA0gAiAEBQhgKFl9mcm9tX2V4cGVjdGVkX3ZlcnNpb24iYAoOTXV0YXRpb25SZXN1bHQSDAoEcGF0aBgBIAEoCRIPCgd2ZXJzaW9uGAIgASgDEgoKAm9wGAMgASgJEhEKCWZyb21fcGF0aBgEIAEoCRIQCghhZmZlY3RlZBgFIAEoBSKRAQoSV3JpdGVGaWxlc1Jlc3BvbnNlEjoKBWZpbGVzGAEgAygLMisuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLldyaXR0ZW5GaWxlEj8KB3Jlc3VsdHMYAiADKAsyLi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTXV0YXRpb25SZXN1bHQifgoOQ2hhbmdlbG9nRW50cnkSDQoFdGFibGUYASABKAkSCgoCb3AYAiABKAkSDgoGcm93X2lkGAMgASgJEg8KB3ZlcnNpb24YBCABKAMSMAoMY29tbWl0dGVkX2F0GAUgASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcCJyChdDcmVhdGVGaWxlU3RyZWFtUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIYCgVwYXRocxgCIAMoCUIJukgGkgEDEPQDSgQIAxAESgQIBBAFUgp0dXJuX2Vwb2NoUgdjaGF0X2lkIi0KGENyZWF0ZUZpbGVTdHJlYW1SZXNwb25zZRIRCglzdHJlYW1faWQYASABKAkiegoWV3JpdGVGaWxlU3RyZWFtUmVxdWVzdBIaCglzdHJlYW1faWQYASABKAlCB7pIBHICEAESRAoDb3BzGAIgAygLMiwuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkZpbGVTdHJlYW1PcEIJukgGkgEDEPQDIm0KDEZpbGVTdHJlYW1PcBIVCgRwYXRoGAEgASgJQge6SARyAhABEgoKAm9wGAIgASgJEhIKBWRlbHRhGAMgASgJSACIAQESEgoFcmVzZXQYBCABKAhIAYgBAUIICgZfZGVsdGFCCAoGX3Jlc2V0IhkKF1dyaXRlRmlsZVN0cmVhbVJlc3BvbnNlIjQKFkFib3J0RmlsZVN0cmVhbVJlcXVlc3QSGgoJc3RyZWFtX2lkGAEgASgJQge6SARyAhABIhkKF0Fib3J0RmlsZVN0cmVhbVJlc3BvbnNlIkYKC1Jvd0NvbmZsaWN0EgwKBHBhdGgYASABKAkSFwoPY3VycmVudF92ZXJzaW9uGAIgASgDSgQIAxAEUgp1cGRhdGVkX2F0IlAKDkNvbmZsaWN0RGV0YWlsEj4KCWNvbmZsaWN0cxgBIAMoCzIrLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Sb3dDb25mbGljdCJIChFEZWxldGVGaWxlUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIVCgRwYXRoGAIgASgJQge6SARyAhABIiUKEkRlbGV0ZUZpbGVSZXNwb25zZRIPCgdkZWxldGVkGAEgASgFIpsBChJEZWxldGVGaWxlc1JlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESHQoFcGF0aHMYAiADKAlCDrpIC5IBCAgBIgRyAhABEhcKCnR1cm5fZXBvY2gYAyABKANIAIgBARIUCgdjaGF0X2lkGAQgASgJSAGIAQFCDQoLX3R1cm5fZXBvY2hCCgoIX2NoYXRfaWQiJgoTRGVsZXRlRmlsZXNSZXNwb25zZRIPCgdkZWxldGVkGAEgASgFIoIBCg9Db3B5RmlsZVJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESFAoDc3JjGAIgASgJQge6SARyAhABEhUKBGRlc3QYAyABKAlCB7pIBHICEAESDAoEbW92ZRgEIAEoCBIWCg5zcmNfcHJvamVjdF9pZBgFIAEoCSIzChBDb3B5RmlsZVJlc3BvbnNlEg4KBmNvcGllZBgBIAMoCRIPCgd3YXJuaW5nGAIgASgJIjoKCEZpbGVFZGl0EhoKCm9sZF9zdHJpbmcYASABKAlCBrpIA8gBARISCgpuZXdfc3RyaW5nGAIgASgJIocCCg9FZGl0RmlsZVJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESFQoEcGF0aBgCIAEoCUIHukgEcgIQARJBCgVlZGl0cxgDIAMoCzIoLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5GaWxlRWRpdEIIukgFkgECCAESFwoKdHVybl9lcG9jaBgEIAEoA0gAiAEBEhQKB2NoYXRfaWQYBSABKAlIAYgBARIdChBleHBlY3RlZF92ZXJzaW9uGAYgASgDSAKIAQFCDQoLX3R1cm5fZXBvY2hCCgoIX2NoYXRfaWRCEwoRX2V4cGVjdGVkX3ZlcnNpb24iWQoQRWRpdEZpbGVSZXNwb25zZRIMCgRwYXRoGAEgASgJEhUKDWVkaXRzX2FwcGxpZWQYAiABKAUSFAoHdmVyc2lvbhgDIAEoA0gAiAEBQgoKCF92ZXJzaW9uIk8KCUdyZXBNYXRjaBIMCgRwYXRoGAEgASgJEgwKBGxpbmUYAiABKAUSFQoNY29udGV4dF9zdGFydBgDIAEoBRIPCgdjb250ZXh0GAQgAygJIlgKEEdyZXBGaWxlc1JlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESGAoHcGF0dGVybhgCIAEoCUIHukgEcgIQARIMCgRwYXRoGAMgASgJIk8KEUdyZXBGaWxlc1Jlc3BvbnNlEjoKB21hdGNoZXMYASADKAsyKS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR3JlcE1hdGNoImwKEVVwbG9hZEZpbGVSZXF1ZXN0Ej4KBG1ldGEYASABKAsyLi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuVXBsb2FkRmlsZU1ldGFIABIOCgRkYXRhGAIgASgMSABCBwoFY2h1bmsiaQoOVXBsb2FkRmlsZU1ldGESHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESFQoEcGF0aBgCIAEoCUIHukgEcgIQARIUCgxjb250ZW50X3R5cGUYAyABKAkSDAoEc2l6ZRgEIAEoAyIwChJVcGxvYWRGaWxlUmVzcG9uc2USDAoEcGF0aBgBIAEoCRIMCgRzaXplGAIgASgDIlAKDUFzc2V0Vmlld3BvcnQSFgoFd2lkdGgYASABKAVCB7pIBBoCIAASHAoGaGVpZ2h0GAIgASgFQge6SAQaAiAASACIAQFCCQoHX2hlaWdodCLqAwoMUHJvamVjdEFzc2V0EgwKBG5hbWUYASABKAkSDAoEcGF0aBgCIAEoCRI7CgZzdGF0dXMYAyABKA4yKy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQXNzZXRTdGF0dXMSFQoIc3VidGl0bGUYBCABKAlIAIgBARJECgh2aWV3cG9ydBgFIAEoCzItLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Bc3NldFZpZXdwb3J0SAGIAQESDgoGcGlubmVkGAYgASgIEhQKB2NoYXRfaWQYByABKAlIAogBARIuCgpjcmVhdGVkX2F0GAggASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcBI6ChFzdGF0dXNfY2hhbmdlZF9hdBgJIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXBIA4gBARIeChFzdGF0dXNfY2hhbmdlZF9ieRgKIAEoCUgEiAEBEhQKB3NlY3Rpb24YCyABKAlIBYgBAUILCglfc3VidGl0bGVCCwoJX3ZpZXdwb3J0QgoKCF9jaGF0X2lkQhQKEl9zdGF0dXNfY2hhbmdlZF9hdEIUChJfc3RhdHVzX2NoYW5nZWRfYnlCCgoIX3NlY3Rpb24iOAoYTGlzdFByb2plY3RBc3NldHNSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBIlkKGUxpc3RQcm9qZWN0QXNzZXRzUmVzcG9uc2USPAoGYXNzZXRzGAEgAygLMiwuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlByb2plY3RBc3NldCKUAwoSUmVjb3JkQXNzZXRSZXF1ZXN0EhwKCnByb2plY3RfaWQYASABKAlCCLpIBXIDsAEBEhgKBG5hbWUYAiABKAlCCrpIB3IFEAEY/wESGAoEcGF0aBgDIAEoCUIKukgHcgUQARiABBIfCghzdWJ0aXRsZRgEIAEoCUIIukgFcgMY/wFIAIgBARJECgh2aWV3cG9ydBgFIAEoCzItLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Bc3NldFZpZXdwb3J0SAGIAQESHQoHY2hhdF9pZBgGIAEoCUIHukgEcgIYQEgCiAEBEkoKBnN0YXR1cxgHIAEoDjIrLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Bc3NldFN0YXR1c0IIukgFggECEAFIA4gBARIdCgdzZWN0aW9uGAggASgJQge6SARyAhhASASIAQFCCwoJX3N1YnRpdGxlQgsKCV92aWV3cG9ydEIKCghfY2hhdF9pZEIJCgdfc3RhdHVzQgoKCF9zZWN0aW9uIlIKE1JlY29yZEFzc2V0UmVzcG9uc2USOwoFYXNzZXQYASABKAsyLC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUHJvamVjdEFzc2V0IrIBChVTZXRBc3NldFN0YXR1c1JlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESGAoEbmFtZRgCIAEoCUIKukgHcgUQARj/ARIYCgRwYXRoGAMgASgJQgq6SAdyBRABGIAEEkcKBnN0YXR1cxgEIAEoDjIrLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Bc3NldFN0YXR1c0IKukgHggEEEAEgACIYChZTZXRBc3NldFN0YXR1c1Jlc3BvbnNlIoECChJEZWxldGVBc3NldFJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESFgoEbmFtZRgCIAEoCUIIukgFcgMY/wESHQoEcGF0aBgDIAEoCUIKukgHcgUQARiABEgAiAEBOowBukiIARqFAQohZGVsZXRlX2Fzc2V0LnJlcXVpcmVfbmFtZV9vcl9wYXRoEihhdCBsZWFzdCBvbmUgb2YgbmFtZSBvciBwYXRoIG11c3QgYmUgc2V0GjZ0aGlzLm5hbWUgIT0gJycgfHwgKGhhcyh0aGlzLnBhdGgpICYmIHRoaXMucGF0aCAhPSAnJylCBwoFX3BhdGgiFQoTRGVsZXRlQXNzZXRSZXNwb25zZSKOAgoLQ2hhdFJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESIAoQbWVzc2FnZXNfcmVxdWVzdBgCIAEoDEIGukgDyAEBEg8KB2NoYXRfaWQYAyABKAkSHAoUYXNzaXN0YW50X21lc3NhZ2VfaWQYBCABKAkSJQoYYXV0b19mYWxsYmFja19vbl9yZWZ1c2FsGAcgASgISACIAQESFwoKdHVybl9lcG9jaBgIIAEoA0gBiAEBQhsKGV9hdXRvX2ZhbGxiYWNrX29uX3JlZnVzYWxCDQoLX3R1cm5fZXBvY2hKBAgFEAZKBAgGEAdSCWl0ZXJfdXVpZFINcmVzdW1lX2Zyb21fbiKBBAoMQ2hhdFJlc3BvbnNlEkUKC3Rva2VuX2NvdW50GAEgASgLMi4uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNoYXRUb2tlbkNvdW50SAASQwoKdGV4dF9kZWx0YRgCIAEoCzItLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DaGF0VGV4dERlbHRhSAASSQoNbWVzc2FnZV9zdGFydBgDIAEoCzIwLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DaGF0TWVzc2FnZVN0YXJ0SAASRwoMbWVzc2FnZV9zdG9wGAQgASgLMi8uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNoYXRNZXNzYWdlU3RvcEgAEjoKBWVycm9yGAUgASgLMikuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNoYXRFcnJvckgAEjYKA3JhdxgGIAEoCzInLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DaGF0UmF3SAASSwoObW9kZWxfZmFsbGJhY2sYCCABKAsyMS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ2hhdE1vZGVsRmFsbGJhY2tIAEIHCgVldmVudEoECAcQCFIBbiJQCg5DaGF0VG9rZW5Db3VudBIUCgxpbnB1dF90b2tlbnMYASABKAUSFQoNb3V0cHV0X3Rva2VucxgCIAEoBToRqrUYDQoLdG9rZW5fY291bnQiLwoNQ2hhdFRleHREZWx0YRIMCgR0ZXh0GAEgASgJOhCqtRgMCgp0ZXh0X2RlbHRhIjsKEENoYXRNZXNzYWdlU3RhcnQSEgoKbWVzc2FnZV9pZBgBIAEoCToTqrUYDwoNbWVzc2FnZV9zdGFydCI6Cg9DaGF0TWVzc2FnZVN0b3ASEwoLc3RvcF9yZWFzb24YASABKAk6Eqq1GA4KDG1lc3NhZ2Vfc3RvcCKEAQoRQ2hhdE1vZGVsRmFsbGJhY2sSEgoKZnJvbV9tb2RlbBgBIAEoCRIQCgh0b19tb2RlbBgCIAEoCRIVCghjYXRlZ29yeRgDIAEoCUgAiAEBEg8KB3JldHJpZWQYBCABKAg6FKq1GBAKDm1vZGVsX2ZhbGxiYWNrQgsKCV9jYXRlZ29yeSLFAQoJQ2hhdEVycm9yEg8KB21lc3NhZ2UYASABKAkSEgoKZmllbGRfcGF0aBgCIAEoCRISCgpyZXF1ZXN0X2lkGAMgASgJEhIKCmVycm9yX3R5cGUYBCABKAkSFwoPcmF0ZV9saW1pdF9raW5kGAUgASgJEhcKD3JhdGVfbGltaXRfdHlwZRgGIAEoCRIRCglyZXNldHNfYXQYByABKAMSGQoRcmF0ZV9saW1pdF9yZWFzb24YCCABKAk6C6q1GAcKBWVycm9yIjYKB0NoYXRSYXcSEgoKZXZlbnRfdHlwZRgBIAEoCRIMCgRkYXRhGAIgASgMOgmqtRgFCgNyYXciNgoSQ291bnRUb2tlbnNSZXF1ZXN0EiAKEG1lc3NhZ2VzX3JlcXVlc3QYASABKAxCBrpIA8gBASIrChNDb3VudFRva2Vuc1Jlc3BvbnNlEhQKDGlucHV0X3Rva2VucxgBIAEoBSIXChVGaWdtYVN0YXJ0QXV0aFJlcXVlc3QiQwoWRmlnbWFTdGFydEF1dGhSZXNwb25zZRIQCghhdXRoX3VybBgBIAEoCRIXCg9jYWxsYmFja19vcmlnaW4YAiABKAkiFwoVRmlnbWFHZXRTdGF0dXNSZXF1ZXN0IisKFkZpZ21hR2V0U3RhdHVzUmVzcG9uc2USEQoJY29ubmVjdGVkGAEgASgIIhgKFkZpZ21hRGlzY29ubmVjdFJlcXVlc3QiGQoXRmlnbWFEaXNjb25uZWN0UmVzcG9uc2UiQAoYRmlnbWFFeGNoYW5nZUNvZGVSZXF1ZXN0EhUKBGNvZGUYASABKAlCB7pIBHICEAESDQoFc3RhdGUYAiABKAkiGwoZRmlnbWFFeGNoYW5nZUNvZGVSZXNwb25zZSJECglGaWdtYVRvb2wSDAoEbmFtZRgBIAEoCRITCgtkZXNjcmlwdGlvbhgCIAEoCRIUCgxpbnB1dF9zY2hlbWEYAyABKAwiFwoVRmlnbWFMaXN0VG9vbHNSZXF1ZXN0ImUKFkZpZ21hTGlzdFRvb2xzUmVzcG9uc2USOAoFdG9vbHMYASADKAsyKS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRmlnbWFUb29sEhEKCWNvbm5lY3RlZBgCIAEoCCJAChRGaWdtYUNhbGxUb29sUmVxdWVzdBIVCgRuYW1lGAEgASgJQge6SARyAhABEhEKCWFyZ3VtZW50cxgCIAEoDCInChVGaWdtYUNhbGxUb29sUmVzcG9uc2USDgoGcmVzdWx0GAEgASgMIhgKFkdvb2dsZVN0YXJ0QXV0aFJlcXVlc3QiRAoXR29vZ2xlU3RhcnRBdXRoUmVzcG9uc2USEAoIYXV0aF91cmwYASABKAkSFwoPY2FsbGJhY2tfb3JpZ2luGAIgASgJIhgKFkdvb2dsZUdldFN0YXR1c1JlcXVlc3QiLAoXR29vZ2xlR2V0U3RhdHVzUmVzcG9uc2USEQoJY29ubmVjdGVkGAEgASgIIhkKF0dvb2dsZURpc2Nvbm5lY3RSZXF1ZXN0IhoKGEdvb2dsZURpc2Nvbm5lY3RSZXNwb25zZSI4ChlHb29nbGVFeGNoYW5nZUNvZGVSZXF1ZXN0EgwKBGNvZGUYASABKAkSDQoFc3RhdGUYAiABKAkiHAoaR29vZ2xlRXhjaGFuZ2VDb2RlUmVzcG9uc2UiTgoZR29vZ2xlVXBsb2FkU2xpZGVzUmVxdWVzdBIXCgV0aXRsZRgBIAEoCUIIukgFcgMY+gESGAoEZGF0YRgCIAEoDEIKukgHegUYgICAGSJBChpHb29nbGVVcGxvYWRTbGlkZXNSZXNwb25zZRISCgpzbGlkZXNfdXJsGAEgASgJEg8KB2ZpbGVfaWQYAiABKAkiOQoeR29vZ2xlU3RhcnRTbGlkZXNVcGxvYWRSZXF1ZXN0EhcKBXRpdGxlGAEgASgJQgi6SAVyAxiAAiI7Ch9Hb29nbGVTdGFydFNsaWRlc1VwbG9hZFJlc3BvbnNlEhgKC3Nlc3Npb25fdXJpGAEgASgJQgOAAQEiGAoWR2l0aHViU3RhcnRBdXRoUmVxdWVzdCJEChdHaXRodWJTdGFydEF1dGhSZXNwb25zZRIQCghhdXRoX3VybBgBIAEoCRIXCg9jYWxsYmFja19vcmlnaW4YAiABKAkiGAoWR2l0aHViR2V0U3RhdHVzUmVxdWVzdCJxChdHaXRodWJHZXRTdGF0dXNSZXNwb25zZRIRCgljb25uZWN0ZWQYASABKAgSGQoRZ2l0aHViX3VzZXJfbG9naW4YAiABKAkSEwoLZ2l0aHViX2hvc3QYAyABKAkSEwoLaW5zdGFsbF91cmwYBCABKAkiGQoXR2l0aHViRGlzY29ubmVjdFJlcXVlc3QiGgoYR2l0aHViRGlzY29ubmVjdFJlc3BvbnNlImMKGUdpdGh1YkV4Y2hhbmdlQ29kZVJlcXVlc3QSFQoEY29kZRgBIAEoCUIHukgEcgIQARIWCgVzdGF0ZRgCIAEoCUIHukgEcgIQARIXCg9pbnN0YWxsYXRpb25faWQYAyABKAMiawoaR2l0aHViRXhjaGFuZ2VDb2RlUmVzcG9uc2USGQoRZ2l0aHViX3VzZXJfbG9naW4YASABKAkSFwoPaW5zdGFsbGF0aW9uX2lkGAIgASgDEhkKEXNzb19maWx0ZXJlZF9vcmdzGAMgAygJIn0KCkdpdGh1YlJlcG8SCgoCaWQYASABKAMSEQoJZnVsbF9uYW1lGAIgASgJEg8KB3ByaXZhdGUYAyABKAgSFgoOZGVmYXVsdF9icmFuY2gYBCABKAkSEwoLZGVzY3JpcHRpb24YBSABKAkSEgoKdXBkYXRlZF9hdBgGIAEoCSIYChZHaXRodWJMaXN0UmVwb3NSZXF1ZXN0IlQKF0dpdGh1Ykxpc3RSZXBvc1Jlc3BvbnNlEjkKBXJlcG9zGAEgAygLMiouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdpdGh1YlJlcG8iSAoPR2l0aHViVHJlZUVudHJ5EgwKBHBhdGgYASABKAkSDAoEdHlwZRgCIAEoCRIMCgRzaXplGAMgASgDEgsKA3NoYRgEIAEoCSKzAQoUR2l0aHViR2V0VHJlZVJlcXVlc3QSKQoFb3duZXIYASABKAlCGrpIF3IVEAEyEV5bQS1aYS16MC05Ll8tXSskEigKBHJlcG8YAiABKAlCGrpIF3IVEAEyEV5bQS1aYS16MC05Ll8tXSskEgsKA3JlZhgDIAEoCRITCgtwYXRoX3ByZWZpeBgEIAEoCRIWCglyZWN1cnNpdmUYBSABKAhIAIgBAUIMCgpfcmVjdXJzaXZlIocBChVHaXRodWJHZXRUcmVlUmVzcG9uc2USQAoHZW50cmllcxgBIAMoCzIvLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HaXRodWJUcmVlRW50cnkSFAoMcmVzb2x2ZWRfc2hhGAIgASgJEhYKDnRydW5jYXRlZF9ub3RlGAMgASgJIs0BChdHaXRodWJJbXBvcnRSZXBvUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIpCgVvd25lchgCIAEoCUIaukgXchUQATIRXltBLVphLXowLTkuXy1dKyQSKAoEcmVwbxgDIAEoCUIaukgXchUQATIRXltBLVphLXowLTkuXy1dKyQSCwoDcmVmGAQgASgJEhMKC3BhdGhfcHJlZml4GAUgASgJEh0KBXBhdGhzGAYgAygJQg66SAuSAQgQMiIEcgIQASJJChhHaXRodWJJbXBvcnRSZXBvUmVzcG9uc2USFgoOZmlsZXNfaW1wb3J0ZWQYASABKAUSFQoNZmlsZXNfc2tpcHBlZBgCIAEoBSKQAQoVR2l0aHViUmVhZEZpbGVSZXF1ZXN0EikKBW93bmVyGAEgASgJQhq6SBdyFRABMhFeW0EtWmEtejAtOS5fLV0rJBIoCgRyZXBvGAIgASgJQhq6SBdyFRABMhFeW0EtWmEtejAtOS5fLV0rJBILCgNyZWYYAyABKAkSFQoEcGF0aBgEIAEoCUIHukgEcgIQASJJChZHaXRodWJSZWFkRmlsZVJlc3BvbnNlEg8KB2NvbnRlbnQYASABKAkSDAoEc2l6ZRgCIAEoAxIQCghlbmNvZGluZxgDIAEoCSI7CglNY3BTZXJ2ZXISCgoCaWQYASABKAkSFAoMZGlzcGxheV9uYW1lGAIgASgJEgwKBGtpbmQYAyABKAkiGQoXTWNwTGlzdENvbm5lY3RlZFJlcXVlc3QiVgoYTWNwTGlzdENvbm5lY3RlZFJlc3BvbnNlEjoKB3NlcnZlcnMYASADKAsyKS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTWNwU2VydmVyIpEBCgxNY3BDb25uZWN0b3ISFAoMZGlzcGxheV9uYW1lGAEgASgJEhEKCWNvbm5lY3RlZBgCIAEoCBIdChFoYXNfZGVzaWduX2ltcG9ydBgDIAEoCEICGAESEQoJc2VydmVyX2lkGAQgASgJEhAKCGljb25fdXJsGAYgASgJSgQIBRAGUg5leHBlY3RlZF9ob3N0cyI3ChhNY3BMaXN0Q29ubmVjdG9yc1JlcXVlc3QSGwoTaW5jbHVkZV91bmNvbm5lY3RlZBgBIAEoCCJdChlNY3BMaXN0Q29ubmVjdG9yc1Jlc3BvbnNlEkAKCmNvbm5lY3RvcnMYASADKAsyLC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTWNwQ29ubmVjdG9yIqoCChZNY3BEZXNpZ25JbXBvcnRQYXJ0bmVyEhEKCXNlcnZlcl9pZBgBIAEoCRIUCgxkaXNwbGF5X25hbWUYAiABKAkSEAoIaWNvbl91cmwYAyABKAkSGAoLZ3JvdXBfbGFiZWwYBSABKAlIAIgBARIaCg1kaXNwbGF5X2xhYmVsGAYgASgJSAGIAQESEQoEcmFuaxgHIAEoBUgCiAEBEhEKCWNvbm5lY3RlZBgIIAEoCBIgChNjb25uZWN0b3Jfc2VydmVyX2lkGAkgASgJSAOIAQFCDgoMX2dyb3VwX2xhYmVsQhAKDl9kaXNwbGF5X2xhYmVsQgcKBV9yYW5rQhYKFF9jb25uZWN0b3Jfc2VydmVyX2lkSgQIBBAFUg5leHBlY3RlZF9ob3N0cyIkCiJNY3BMaXN0RGVzaWduSW1wb3J0UGFydG5lcnNSZXF1ZXN0Im8KI01jcExpc3REZXNpZ25JbXBvcnRQYXJ0bmVyc1Jlc3BvbnNlEkgKCHBhcnRuZXJzGAEgAygLMjYuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLk1jcERlc2lnbkltcG9ydFBhcnRuZXIiRgoLVG9vbGJveFRvb2wSDAoEbmFtZRgBIAEoCRITCgtkZXNjcmlwdGlvbhgCIAEoCRIUCgxpbnB1dF9zY2hlbWEYAyABKAwidQoOTWNwU2VydmVyVG9vbHMSEQoJc2VydmVyX2lkGAEgASgJEhQKDGRpc3BsYXlfbmFtZRgCIAEoCRI6CgV0b29scxgDIAMoCzIrLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Ub29sYm94VG9vbCIwChNNY3BMaXN0VG9vbHNSZXF1ZXN0EhkKEWNsaWVudF9zZXNzaW9uX2lkGAEgASgJInIKFE1jcExpc3RUb29sc1Jlc3BvbnNlEhkKEWNsaWVudF9zZXNzaW9uX2lkGAEgASgJEj8KB3NlcnZlcnMYAiADKAsyLi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTWNwU2VydmVyVG9vbHMiMgoVTWNwU3RyZWFtVG9vbHNSZXF1ZXN0EhkKEWNsaWVudF9zZXNzaW9uX2lkGAEgASgJIlgKFk1jcFN0cmVhbVRvb2xzUmVzcG9uc2USPgoGc2VydmVyGAEgASgLMi4uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLk1jcFNlcnZlclRvb2xzInoKEk1jcENhbGxUb29sUmVxdWVzdBIaCglzZXJ2ZXJfaWQYASABKAlCB7pIBHICEAESGgoJdG9vbF9uYW1lGAIgASgJQge6SARyAhABEhEKCWFyZ3VtZW50cxgDIAEoDBIZChFjbGllbnRfc2Vzc2lvbl9pZBgEIAEoCSIlChNNY3BDYWxsVG9vbFJlc3BvbnNlEg4KBnJlc3VsdBgBIAEoDCJKCglVc2VyU2tpbGwSCgoCaWQYASABKAkSDAoEbmFtZRgCIAEoCRITCgtkZXNjcmlwdGlvbhgDIAEoCRIOCgZzb3VyY2UYBCABKAkiFwoVTGlzdFVzZXJTa2lsbHNSZXF1ZXN0IlMKFkxpc3RVc2VyU2tpbGxzUmVzcG9uc2USOQoGc2tpbGxzGAEgAygLMikuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVzZXJTa2lsbCJRCh9HZXRVc2VyU2tpbGxJbnN0cnVjdGlvbnNSZXF1ZXN0Ei4KCHNraWxsX2lkGAEgASgJQhy6SBlyFxABGIABMhBeW0EtWmEtejAtOV8tXSskIlIKIEdldFVzZXJTa2lsbEluc3RydWN0aW9uc1Jlc3BvbnNlEgoKAmlkGAEgASgJEgwKBG5hbWUYAiABKAkSFAoMaW5zdHJ1Y3Rpb25zGAMgASgJIoQCChFUcmFja0V2ZW50UmVxdWVzdBIbCgpldmVudF9uYW1lGAEgASgJQge6SARyAhABElUKCnByb3BlcnRpZXMYAiADKAsyQS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuVHJhY2tFdmVudFJlcXVlc3QuUHJvcGVydGllc0VudHJ5EhcKCnByb2plY3RfaWQYAyABKAlIAIgBARIUCgdjaGF0X2lkGAQgASgJSAGIAQEaMQoPUHJvcGVydGllc0VudHJ5EgsKA2tleRgBIAEoCRINCgV2YWx1ZRgCIAEoCToCOAFCDQoLX3Byb2plY3RfaWRCCgoIX2NoYXRfaWQiFAoSVHJhY2tFdmVudFJlc3BvbnNlIvABCh1TZW5kTXVsdGlwbGF5ZXJNZXNzYWdlUmVxdWVzdBIcCgpwcm9qZWN0X2lkGAEgASgJQgi6SAVyA7ABARIYCgdjaGF0X2lkGAIgASgJQge6SARyAhABEg8KB2NvbnRlbnQYAyABKAkSFQoEcm9sZRgEIAEoCUIHukgEcgIQARIeChFkaXNwbGF5X21ldGFfanNvbhgFIAEoCUgAiAEBEh4KFmNvbW1pdF9vbl9hY3F1aXJlX29ubHkYBiABKAgSGQoRY2xpZW50X21lc3NhZ2VfaWQYByABKAlCFAoSX2Rpc3BsYXlfbWV0YV9qc29uIt4BCh5TZW5kTXVsdGlwbGF5ZXJNZXNzYWdlUmVzcG9uc2USEgoKbWVzc2FnZV9pZBgBIAEoCRIYCg5hY3F1aXJlZF9lcG9jaBgCIAEoA0gAEh0KE2hvbGRlcl9hY2NvdW50X3V1aWQYAyABKAlIABIaCg1ob2xkZXJfdGFiX2lkGAQgASgJSAGIAQESHQoQaG9sZGVyX2NsaWVudF9pZBgFIAEoCUgCiAEBQg0KC2xvY2tfcmVzdWx0QhAKDl9ob2xkZXJfdGFiX2lkQhMKEV9ob2xkZXJfY2xpZW50X2lkIlkKEFJlbmV3VHVyblJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESGAoHY2hhdF9pZBgCIAEoCUIHukgEcgIQARINCgVlcG9jaBgDIAEoAyITChFSZW5ld1R1cm5SZXNwb25zZSJbChJSZWxlYXNlVHVyblJlcXVlc3QSHAoKcHJvamVjdF9pZBgBIAEoCUIIukgFcgOwAQESGAoHY2hhdF9pZBgCIAEoCUIHukgEcgIQARINCgVlcG9jaBgDIAEoAyIVChNSZWxlYXNlVHVyblJlc3BvbnNlIlcKFERlbGV0ZUFjY291bnRSZXF1ZXN0EhwKCmFjY291bnRfaWQYASABKAlCCLpIBXIDsAEBEiEKD29yZ2FuaXphdGlvbl9pZBgCIAEoCUIIukgFcgOwAQEiFwoVRGVsZXRlQWNjb3VudFJlc3BvbnNlIj4KGURlbGV0ZU9yZ2FuaXphdGlvblJlcXVlc3QSIQoPb3JnYW5pemF0aW9uX2lkGAEgASgJQgi6SAVyA7ABASIcChpEZWxldGVPcmdhbml6YXRpb25SZXNwb25zZSLUAQoZTGlzdENoYXRzRm9yRXhwb3J0UmVxdWVzdBIhCg9vcmdhbml6YXRpb25faWQYASABKAlCCLpIBXIDsAEBEjcKDmNyZWF0ZWRfYXRfZ3RlGAIgASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcEgAiAEBEjYKDWNyZWF0ZWRfYXRfbHQYAyABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wSAGIAQFCEQoPX2NyZWF0ZWRfYXRfZ3RlQhAKDl9jcmVhdGVkX2F0X2x0IsQBChRFeHBvcnRDaGF0SW5kZXhFbnRyeRIUCgxwcm9qZWN0X3V1aWQYASABKAkSFAoMcHJvamVjdF9uYW1lGAIgASgJEhEKCWNoYXRfdXVpZBgDIAEoCRINCgV0aXRsZRgEIAEoCRIuCgpjcmVhdGVkX2F0GAUgASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcBIuCgp1cGRhdGVkX2F0GAYgASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcCJhChpMaXN0Q2hhdHNGb3JFeHBvcnRSZXNwb25zZRJDCgVjaGF0cxgBIAMoCzI0LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5FeHBvcnRDaGF0SW5kZXhFbnRyeSJ7ChlFeHBvcnRDaGF0TWVzc2FnZXNSZXF1ZXN0EiEKD29yZ2FuaXphdGlvbl9pZBgBIAEoCUIIukgFcgOwAQESHgoMcHJvamVjdF91dWlkGAIgASgJQgi6SAVyA7ABARIbCgljaGF0X3V1aWQYAyABKAlCCLpIBXIDsAEBInMKD0V4cG9ydGVkTWVzc2FnZRIMCgR1dWlkGAEgASgJEgwKBHJvbGUYAiABKAkSFAoMY29udGVudF9qc29uGAMgASgJEi4KCmNyZWF0ZWRfYXQYBCABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wIl8KGkV4cG9ydENoYXRNZXNzYWdlc1Jlc3BvbnNlEkEKCG1lc3NhZ2VzGAEgAygLMi8uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkV4cG9ydGVkTWVzc2FnZSKiAwoRQ29tcGxpYW5jZVByb2plY3QSFAoMcHJvamVjdF91dWlkGAEgASgJEhkKEW9yZ2FuaXphdGlvbl91dWlkGAIgASgJEhoKEm93bmVyX2FjY291bnRfdXVpZBgDIAEoCRIMCgRuYW1lGAQgASgJEgwKBHR5cGUYBSABKAkSOAoHc2hhcmluZxgGIAEoCzInLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5TaGFyaW5nEi4KCmNyZWF0ZWRfYXQYByABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEi4KCnVwZGF0ZWRfYXQYCCABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEjMKCmRlbGV0ZWRfYXQYCSABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wSACIAQESNQoMcHVibGlzaGVkX2F0GAogASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcEgBiAEBQg0KC19kZWxldGVkX2F0Qg8KDV9wdWJsaXNoZWRfYXQi+gIKIExpc3RQcm9qZWN0c0ZvckNvbXBsaWFuY2VSZXF1ZXN0EiYKD29yZ2FuaXphdGlvbl9pZBgBIAEoCUIIukgFcgOwAQFIAIgBARI3Cg5jcmVhdGVkX2F0X2d0ZRgCIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXBIAYgBARI2Cg1jcmVhdGVkX2F0X2x0GAMgASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcEgCiAEBEiIKCXBhZ2Vfc2l6ZRgEIAEoBUIKukgHGgUY9AMoAUgDiAEBEhcKCnBhZ2VfdG9rZW4YBSABKAlIBIgBARIqChBvcmdhbml6YXRpb25faWRzGAYgAygJQhC6SA2SAQoQ9AMiBXIDsAEBQhIKEF9vcmdhbml6YXRpb25faWRCEQoPX2NyZWF0ZWRfYXRfZ3RlQhAKDl9jcmVhdGVkX2F0X2x0QgwKCl9wYWdlX3NpemVCDQoLX3BhZ2VfdG9rZW4imgEKIUxpc3RQcm9qZWN0c0ZvckNvbXBsaWFuY2VSZXNwb25zZRJDCghwcm9qZWN0cxgBIAMoCzIxLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Db21wbGlhbmNlUHJvamVjdBIcCg9uZXh0X3BhZ2VfdG9rZW4YAiABKAlIAIgBAUISChBfbmV4dF9wYWdlX3Rva2VuInwKHkdldFByb2plY3RGb3JDb21wbGlhbmNlUmVxdWVzdBImCg9vcmdhbml6YXRpb25faWQYASABKAlCCLpIBXIDsAEBSACIAQESHgoMcHJvamVjdF91dWlkGAIgASgJQgi6SAVyA7ABAUISChBfb3JnYW5pemF0aW9uX2lkInkKH0dldFByb2plY3RGb3JDb21wbGlhbmNlUmVzcG9uc2USQgoHcHJvamVjdBgBIAEoCzIxLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Db21wbGlhbmNlUHJvamVjdBISCgpmaWxlX2NvdW50GAIgASgDIuABChVDb21wbGlhbmNlUHJvamVjdEZpbGUSEQoJZmlsZV91dWlkGAEgASgJEgwKBHBhdGgYAiABKAkSGQoMY29udGVudF90eXBlGAMgASgJSACIAQESEQoEc2l6ZRgEIAEoA0gBiAEBEi4KCmNyZWF0ZWRfYXQYBSABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEi4KCnVwZGF0ZWRfYXQYBiABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wQg8KDV9jb250ZW50X3R5cGVCBwoFX3NpemUi3AEKJExpc3RQcm9qZWN0RmlsZXNGb3JDb21wbGlhbmNlUmVxdWVzdBImCg9vcmdhbml6YXRpb25faWQYASABKAlCCLpIBXIDsAEBSACIAQESHgoMcHJvamVjdF91dWlkGAIgASgJQgi6SAVyA7ABARIiCglwYWdlX3NpemUYAyABKAVCCrpIBxoFGPQDKAFIAYgBARIXCgpwYWdlX3Rva2VuGAQgASgJSAKIAQFCEgoQX29yZ2FuaXphdGlvbl9pZEIMCgpfcGFnZV9zaXplQg0KC19wYWdlX3Rva2VuIp8BCiVMaXN0UHJvamVjdEZpbGVzRm9yQ29tcGxpYW5jZVJlc3BvbnNlEkQKBWZpbGVzGAEgAygLMjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNvbXBsaWFuY2VQcm9qZWN0RmlsZRIcCg9uZXh0X3BhZ2VfdG9rZW4YAiABKAlIAIgBAUISChBfbmV4dF9wYWdlX3Rva2VuItEBChVTdWJtaXRGZWVkYmFja1JlcXVlc3QSTwoNZmVlZGJhY2tfdHlwZRgBIAEoDjIsLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5GZWVkYmFja1R5cGVCCrpIB4IBBBABIAASHwoLZGVzY3JpcHRpb24YAiABKAlCCrpIB3IFEAEYgCASIQoKcHJvamVjdF9pZBgDIAEoCUIIukgFcgOwAQFIAIgBARIUCgxpbmNsdWRlX2NoYXQYBCABKAhCDQoLX3Byb2plY3RfaWQiLQoWU3VibWl0RmVlZGJhY2tSZXNwb25zZRITCgtmZWVkYmFja19pZBgBIAEoCSpbCgtBY2Nlc3NMZXZlbBIcChhBQ0NFU1NfTEVWRUxfVU5TUEVDSUZJRUQQABIVChFBQ0NFU1NfTEVWRUxfRlVMTBABEhcKE0FDQ0VTU19MRVZFTF9WSUVXRVIQAiqsAQoOUHVyY2hhc2VTdGF0dXMSHwobUFVSQ0hBU0VfU1RBVFVTX1VOU1BFQ0lGSUVEEAASGwoXUFVSQ0hBU0VfU1RBVFVTX1NVQ0NFU1MQARIjCh9QVVJDSEFTRV9TVEFUVVNfUkVRVUlSRVNfQUNUSU9OEAISGwoXUFVSQ0hBU0VfU1RBVFVTX1BFTkRJTkcQAxIaChZQVVJDSEFTRV9TVEFUVVNfRkFJTEVEEAQqgAEKC1Byb2plY3RUeXBlEhwKGFBST0pFQ1RfVFlQRV9VTlNQRUNJRklFRBAAEhgKFFBST0pFQ1RfVFlQRV9QUk9KRUNUEAESGQoVUFJPSkVDVF9UWVBFX1RFTVBMQVRFEAISHgoaUFJPSkVDVF9UWVBFX0RFU0lHTl9TWVNURU0QAyqbAQoRRGVzaWduUHJvamVjdFJvbGUSIwofREVTSUdOX1BST0pFQ1RfUk9MRV9VTlNQRUNJRklFRBAAEh4KGkRFU0lHTl9QUk9KRUNUX1JPTEVfVklFV0VSEAESIQodREVTSUdOX1BST0pFQ1RfUk9MRV9DT01NRU5URVIQAhIeChpERVNJR05fUFJPSkVDVF9ST0xFX0VESVRPUhADKokBCgtBc3NldFN0YXR1cxIcChhBU1NFVF9TVEFUVVNfVU5TUEVDSUZJRUQQABIdChlBU1NFVF9TVEFUVVNfTkVFRFNfUkVWSUVXEAESGQoVQVNTRVRfU1RBVFVTX0FQUFJPVkVEEAISIgoeQVNTRVRfU1RBVFVTX0NIQU5HRVNfUkVRVUVTVEVEEAMqYAoMRmVlZGJhY2tUeXBlEh0KGUZFRURCQUNLX1RZUEVfVU5TUEVDSUZJRUQQABIVChFGRUVEQkFDS19UWVBFX0JVRxABEhoKFkZFRURCQUNLX1RZUEVfRkVFREJBQ0sQAjLBpwEKD09tZWxldHRlU2VydmljZRKhAQoFR2V0TWUSLC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2V0TWVSZXF1ZXN0Gi0uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldE1lUmVzcG9uc2UiO7q1GA8SDS92MS9kZXNpZ24vbWXCtRgkCgIiAAoCGgAKAioACgISABoQdXNlcjpkZXNpZ246cmVhZDgBErsBChFTZXRNb2RlbFNlbGVjdGlvbhI4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5TZXRNb2RlbFNlbGVjdGlvblJlcXVlc3QaOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU2V0TW9kZWxTZWxlY3Rpb25SZXNwb25zZSIxurUYHzoBKiIaL3YxL2Rlc2lnbi9tb2RlbC1zZWxlY3Rpb27CtRgKCgIiAAoCKgA4ARKvAQoOR2V0VXNhZ2VTdGF0dXMSNS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2V0VXNhZ2VTdGF0dXNSZXF1ZXN0GjYuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldFVzYWdlU3RhdHVzUmVzcG9uc2UiLrq1GBISEC92MS9kZXNpZ24vdXNhZ2XCtRgUGhB1c2VyOmRlc2lnbjpyZWFkOAESuAEKD0xpc3RFeHBlcmllbmNlcxI2LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5MaXN0RXhwZXJpZW5jZXNSZXF1ZXN0GjcuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkxpc3RFeHBlcmllbmNlc1Jlc3BvbnNlIjS6tRgYEhYvdjEvZGVzaWduL2V4cGVyaWVuY2VzwrUYFBoQdXNlcjpkZXNpZ246cmVhZDgBEqkBCg9UcmFja0V4cGVyaWVuY2USNi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuVHJhY2tFeHBlcmllbmNlUmVxdWVzdBo3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5UcmFja0V4cGVyaWVuY2VSZXNwb25zZSIlurUYIToBKiIcL3YxL2Rlc2lnbi9leHBlcmllbmNlcy90cmFjaxLCAQoXRXhlY3V0ZUV4cGVyaWVuY2VBY3Rpb24SPi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRXhlY3V0ZUV4cGVyaWVuY2VBY3Rpb25SZXF1ZXN0Gj8uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkV4ZWN1dGVFeHBlcmllbmNlQWN0aW9uUmVzcG9uc2UiJrq1GCI6ASoiHS92MS9kZXNpZ24vZXhwZXJpZW5jZXMvYWN0aW9uEtYBChZHZXRSZWZlcnJhbEVsaWdpYmlsaXR5Ej0uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldFJlZmVycmFsRWxpZ2liaWxpdHlSZXF1ZXN0Gj4uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldFJlZmVycmFsRWxpZ2liaWxpdHlSZXNwb25zZSI9urUYIRIfL3YxL2Rlc2lnbi9yZWZlcnJhbC9lbGlnaWJpbGl0ecK1GBQaEHVzZXI6ZGVzaWduOnJlYWQ4ARLVAQoMTGlzdFByb2plY3RzEjMuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkxpc3RQcm9qZWN0c1JlcXVlc3QaNC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTGlzdFByb2plY3RzUmVzcG9uc2UiWrq1GC5CCAoGY3Vyc29yQggKBmZpbHRlckIDCgFxEhMvdjEvZGVzaWduL3Byb2plY3RzwrUYJAoCIgAKAhoACgIqAAoCEgAaEHVzZXI6ZGVzaWduOnJlYWQ4ARKwAQoNQ3JlYXRlUHJvamVjdBI0LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DcmVhdGVQcm9qZWN0UmVxdWVzdBo1LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DcmVhdGVQcm9qZWN0UmVzcG9uc2UiMrq1GBg6ASoiEy92MS9kZXNpZ24vcHJvamVjdHPCtRgSCgIiAAoCGgAKAioACgISADgBEsMBCgpHZXRQcm9qZWN0EjEuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldFByb2plY3RSZXF1ZXN0GjIuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldFByb2plY3RSZXNwb25zZSJOurUYIhIgL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH3CtRgkCgIiAAoCGgAKAioACgISABoQdXNlcjpkZXNpZ246cmVhZDgBEr0BCg1VcGRhdGVQcm9qZWN0EjQuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwZGF0ZVByb2plY3RSZXF1ZXN0GjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwZGF0ZVByb2plY3RSZXNwb25zZSI/urUYJToBKhogL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH3CtRgSCgIiAAoCGgAKAioACgISADgBEroBCg1EZWxldGVQcm9qZWN0EjQuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlbGV0ZVByb2plY3RSZXF1ZXN0GjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlbGV0ZVByb2plY3RSZXNwb25zZSI8urUYIiogL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH3CtRgSCgIiAAoCGgAKAioACgISADgBEtQBCg5HZXRQcm9qZWN0RGF0YRI1LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HZXRQcm9qZWN0RGF0YVJlcXVlc3QaNi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2V0UHJvamVjdERhdGFSZXNwb25zZSJTurUYJxIlL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vZGF0YcK1GCQKAiIACgIaAAoCKgAKAhIAGhB1c2VyOmRlc2lnbjpyZWFkOAESzgEKEVVwZGF0ZVByb2plY3REYXRhEjguYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwZGF0ZVByb2plY3REYXRhUmVxdWVzdBo5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5VcGRhdGVQcm9qZWN0RGF0YVJlc3BvbnNlIkS6tRgqOgEqGiUvdjEvZGVzaWduL3Byb2plY3RzL3twcm9qZWN0X2lkfS9kYXRhwrUYEgoCIgAKAhoACgIqAAoCEgA4ARLBAQoKSW1wb3J0Q2hhdBIxLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5JbXBvcnRDaGF0UmVxdWVzdBoyLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5JbXBvcnRDaGF0UmVzcG9uc2UiTLq1GDI6ASoiLS92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L2NoYXRzL2ltcG9ydMK1GBIKAiIACgIaAAoCKgAKAhIAOAESwQEKCkRlbGV0ZUNoYXQSMS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRGVsZXRlQ2hhdFJlcXVlc3QaMi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRGVsZXRlQ2hhdFJlc3BvbnNlIky6tRgyKjAvdjEvZGVzaWduL3Byb2plY3RzL3twcm9qZWN0X2lkfS9jaGF0cy97Y2hhdF9pZH3CtRgSCgIiAAoCGgAKAioACgISADgBEsUBCg1VcGRhdGVTaGFyaW5nEjQuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwZGF0ZVNoYXJpbmdSZXF1ZXN0GjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwZGF0ZVNoYXJpbmdSZXNwb25zZSJHurUYLToBKhooL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vc2hhcmluZ8K1GBIKAiIACgIaAAoCKgAKAhIAOAES0wEKEkxpc3RQcm9qZWN0TWVtYmVycxI5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5MaXN0UHJvamVjdE1lbWJlcnNSZXF1ZXN0GjouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkxpc3RQcm9qZWN0TWVtYmVyc1Jlc3BvbnNlIka6tRgqEigvdjEvZGVzaWduL3Byb2plY3RzL3twcm9qZWN0X2lkfS9tZW1iZXJzwrUYFBoQdXNlcjpkZXNpZ246cmVhZDgBEtQBChJHZXRQcm9qZWN0UHJlc2VuY2USOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2V0UHJvamVjdFByZXNlbmNlUmVxdWVzdBo6LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HZXRQcm9qZWN0UHJlc2VuY2VSZXNwb25zZSJHurUYKxIpL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vcHJlc2VuY2XCtRgUGhB1c2VyOmRlc2lnbjpyZWFkOAESuAEKEEFkZFByb2plY3RNZW1iZXISNy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQWRkUHJvamVjdE1lbWJlclJlcXVlc3QaOC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQWRkUHJvamVjdE1lbWJlclJlc3BvbnNlIjG6tRgtOgEqIigvdjEvZGVzaWduL3Byb2plY3RzL3twcm9qZWN0X2lkfS9tZW1iZXJzEtwBChdVcGRhdGVQcm9qZWN0TWVtYmVyUm9sZRI+LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5VcGRhdGVQcm9qZWN0TWVtYmVyUm9sZVJlcXVlc3QaPy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuVXBkYXRlUHJvamVjdE1lbWJlclJvbGVSZXNwb25zZSJAurUYPDoBKho3L3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vbWVtYmVycy97YWNjb3VudF91dWlkfRLNAQoTUmVtb3ZlUHJvamVjdE1lbWJlchI6LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5SZW1vdmVQcm9qZWN0TWVtYmVyUmVxdWVzdBo7LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5SZW1vdmVQcm9qZWN0TWVtYmVyUmVzcG9uc2UiPbq1GDkqNy92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L21lbWJlcnMve2FjY291bnRfdXVpZH0SrQEKEFNlYXJjaE9yZ01lbWJlcnMSNy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU2VhcmNoT3JnTWVtYmVyc1JlcXVlc3QaOC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU2VhcmNoT3JnTWVtYmVyc1Jlc3BvbnNlIia6tRgiOgEqIh0vdjEvZGVzaWduL29yZy9tZW1iZXJzOnNlYXJjaBK6AQoQRHVwbGljYXRlUHJvamVjdBI3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5EdXBsaWNhdGVQcm9qZWN0UmVxdWVzdBo4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5EdXBsaWNhdGVQcm9qZWN0UmVzcG9uc2UiM7q1GC86ASoiKi92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L2R1cGxpY2F0ZRKqAQoMUmVtaXhQcm9qZWN0EjMuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlJlbWl4UHJvamVjdFJlcXVlc3QaNC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUmVtaXhQcm9qZWN0UmVzcG9uc2UiL7q1GCs6ASoiJi92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L3JlbWl4EtkBChNTZXRQcm9qZWN0VGh1bWJuYWlsEjouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlNldFByb2plY3RUaHVtYm5haWxSZXF1ZXN0GjsuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlNldFByb2plY3RUaHVtYm5haWxSZXNwb25zZSJJurUYLzoBKhoqL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vdGh1bWJuYWlswrUYEgoCIgAKAhoACgIqAAoCEgA4ARLmAQoQTWludFByZXZpZXdUb2tlbhI3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5NaW50UHJldmlld1Rva2VuUmVxdWVzdBo4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5NaW50UHJldmlld1Rva2VuUmVzcG9uc2UiX7q1GDM6ASoiLi92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L3ByZXZpZXctdG9rZW7CtRgkCgIiAAoCGgAKAioACgISABoQdXNlcjpkZXNpZ246cmVhZDgBEr4BChBNaW50SGFuZG9mZlRva2VuEjcuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLk1pbnRIYW5kb2ZmVG9rZW5SZXF1ZXN0GjguYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLk1pbnRIYW5kb2ZmVG9rZW5SZXNwb25zZSI3urUYMzoBKiIuL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vaGFuZG9mZi10b2tlbhKuAQoNQnVuZGxlUHJvamVjdBI0LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5CdW5kbGVQcm9qZWN0UmVxdWVzdBo1LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5CdW5kbGVQcm9qZWN0UmVzcG9uc2UiMLq1GCw6ASoiJy92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L2J1bmRsZRLZAQoXQ3JlYXRlQ2xhdWRlQ29kZVNlc3Npb24SPi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ3JlYXRlQ2xhdWRlQ29kZVNlc3Npb25SZXF1ZXN0Gj8uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNyZWF0ZUNsYXVkZUNvZGVTZXNzaW9uUmVzcG9uc2UiPbq1GDk6ASoiNC92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L2NsYXVkZS1jb2RlLXNlc3Npb24S1AEKDExpc3RDb21tZW50cxIzLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5MaXN0Q29tbWVudHNSZXF1ZXN0GjQuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkxpc3RDb21tZW50c1Jlc3BvbnNlIlm6tRgtEisvdjEvb21lbGV0dGUvcHJvamVjdHMve3Byb2plY3RfaWR9L2NvbW1lbnRzwrUYJAoCIgAKAhoACgIqAAoCEgAaEHVzZXI6ZGVzaWduOnJlYWQ4ARLIAQoNQ3JlYXRlQ29tbWVudBI0LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DcmVhdGVDb21tZW50UmVxdWVzdBo1LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DcmVhdGVDb21tZW50UmVzcG9uc2UiSrq1GDA6ASoiKy92MS9vbWVsZXR0ZS9wcm9qZWN0cy97cHJvamVjdF9pZH0vY29tbWVudHPCtRgSCgIiAAoCGgAKAioACgISADgBEtUBCg1VcGRhdGVDb21tZW50EjQuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwZGF0ZUNvbW1lbnRSZXF1ZXN0GjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwZGF0ZUNvbW1lbnRSZXNwb25zZSJXurUYPToBKho4L3YxL29tZWxldHRlL3Byb2plY3RzL3twcm9qZWN0X2lkfS9jb21tZW50cy97Y29tbWVudF9pZH3CtRgSCgIiAAoCGgAKAioACgISADgBEtIBCg1EZWxldGVDb21tZW50EjQuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlbGV0ZUNvbW1lbnRSZXF1ZXN0GjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlbGV0ZUNvbW1lbnRSZXNwb25zZSJUurUYOio4L3YxL29tZWxldHRlL3Byb2plY3RzL3twcm9qZWN0X2lkfS9jb21tZW50cy97Y29tbWVudF9pZH3CtRgSCgIiAAoCGgAKAioACgISADgBEuwBChJDcmVhdGVDb21tZW50UmVwbHkSOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ3JlYXRlQ29tbWVudFJlcGx5UmVxdWVzdBo6LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DcmVhdGVDb21tZW50UmVwbHlSZXNwb25zZSJfurUYRToBKiJAL3YxL29tZWxldHRlL3Byb2plY3RzL3twcm9qZWN0X2lkfS9jb21tZW50cy97Y29tbWVudF9pZH0vcmVwbGllc8K1GBIKAiIACgIaAAoCKgAKAhIAOAES9AEKEkRlbGV0ZUNvbW1lbnRSZXBseRI5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5EZWxldGVDb21tZW50UmVwbHlSZXF1ZXN0GjouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlbGV0ZUNvbW1lbnRSZXBseVJlc3BvbnNlIme6tRhNKksvdjEvb21lbGV0dGUvcHJvamVjdHMve3Byb2plY3RfaWR9L2NvbW1lbnRzL3tjb21tZW50X2lkfS9yZXBsaWVzL3tyZXBseV9pZH3CtRgSCgIiAAoCGgAKAioACgISADgBEvcBChJVcGRhdGVDb21tZW50UmVwbHkSOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuVXBkYXRlQ29tbWVudFJlcGx5UmVxdWVzdBo6LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5VcGRhdGVDb21tZW50UmVwbHlSZXNwb25zZSJqurUYUDoBKhpLL3YxL29tZWxldHRlL3Byb2plY3RzL3twcm9qZWN0X2lkfS9jb21tZW50cy97Y29tbWVudF9pZH0vcmVwbGllcy97cmVwbHlfaWR9wrUYEgoCIgAKAhoACgIqAAoCEgA4ARLkAQoSU2VuZENvbW1lbnRzVG9DaGF0EjkuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlNlbmRDb21tZW50c1RvQ2hhdFJlcXVlc3QaOi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU2VuZENvbW1lbnRzVG9DaGF0UmVzcG9uc2UiV7q1GD06ASoiOC92MS9vbWVsZXR0ZS9wcm9qZWN0cy97cHJvamVjdF9pZH0vY29tbWVudHMvc2VuZC10by1jaGF0wrUYEgoCIgAKAhoACgIqAAoCEgA4ARLtAQoQTWFya0NvbW1lbnRzUmVhZBI3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5NYXJrQ29tbWVudHNSZWFkUmVxdWVzdBo4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5NYXJrQ29tbWVudHNSZWFkUmVzcG9uc2UiZrq1GDo6ASoiNS92MS9vbWVsZXR0ZS9wcm9qZWN0cy97cHJvamVjdF9pZH0vY29tbWVudHMvbWFyay1yZWFkwrUYJAoCIgAKAhoACgIqAAoCEgAaEHVzZXI6ZGVzaWduOnJlYWQ4ARLOAQoRVXBkYXRlUHJvamVjdFR5cGUSOC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuVXBkYXRlUHJvamVjdFR5cGVSZXF1ZXN0GjkuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwZGF0ZVByb2plY3RUeXBlUmVzcG9uc2UiRLq1GCo6ASoaJS92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L3R5cGXCtRgSCgIiAAoCGgAKAioACgISADgBEtsBChlDcmVhdGVUZW1wbGF0ZUZyb21Qcm9qZWN0EkAuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNyZWF0ZVRlbXBsYXRlRnJvbVByb2plY3RSZXF1ZXN0GkEuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNyZWF0ZVRlbXBsYXRlRnJvbVByb2plY3RSZXNwb25zZSI5urUYNToBKiIwL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vY3JlYXRlLXRlbXBsYXRlEtkBChNTZXRQcm9qZWN0UHVibGlzaGVkEjouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlNldFByb2plY3RQdWJsaXNoZWRSZXF1ZXN0GjsuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlNldFByb2plY3RQdWJsaXNoZWRSZXNwb25zZSJJurUYLzoBKhoqL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vcHVibGlzaGVkwrUYEgoCIgAKAhoACgIqAAoCEgA4ARLOAQoRVXBkYXRlUHJvamVjdEluZm8SOC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuVXBkYXRlUHJvamVjdEluZm9SZXF1ZXN0GjkuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwZGF0ZVByb2plY3RJbmZvUmVzcG9uc2UiRLq1GCo6ASoaJS92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L2luZm/CtRgSCgIiAAoCGgAKAioACgISADgBEvMBChpVcGRhdGVQcm9qZWN0RGVzaWduU3lzdGVtcxJBLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5VcGRhdGVQcm9qZWN0RGVzaWduU3lzdGVtc1JlcXVlc3QaQi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuVXBkYXRlUHJvamVjdERlc2lnblN5c3RlbXNSZXNwb25zZSJOurUYNDoBKhovL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vZGVzaWduLXN5c3RlbXPCtRgSCgIiAAoCGgAKAioACgISADgBEoUCChhSZWZyZXNoQm91bmREZXNpZ25TeXN0ZW0SPy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUmVmcmVzaEJvdW5kRGVzaWduU3lzdGVtUmVxdWVzdBpALmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5SZWZyZXNoQm91bmREZXNpZ25TeXN0ZW1SZXNwb25zZSJmurUYTDoBKiJHL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vZGVzaWduLXN5c3RlbXMve2RzX3Byb2plY3RfaWR9L3JlZnJlc2jCtRgSCgIiAAoCGgAKAioACgISADgBEsgBCglMaW50RmlsZXMSMC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTGludEZpbGVzUmVxdWVzdBoxLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5MaW50RmlsZXNSZXNwb25zZSJWurUYKjoBKiIlL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vbGludMK1GCQKAiIACgIaAAoCKgAKAhIAGhB1c2VyOmRlc2lnbjpyZWFkOAES1QEKElNldFByb2plY3RGYXZvcml0ZRI5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5TZXRQcm9qZWN0RmF2b3JpdGVSZXF1ZXN0GjouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlNldFByb2plY3RGYXZvcml0ZVJlc3BvbnNlIki6tRguOgEqGikvdjEvZGVzaWduL3Byb2plY3RzL3twcm9qZWN0X2lkfS9mYXZvcml0ZcK1GBIKAiIACgIaAAoCKgAKAhIAOAESoAEKEVJlbW92ZUZyb21SZWNlbnRzEjguYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlJlbW92ZUZyb21SZWNlbnRzUmVxdWVzdBo5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5SZW1vdmVGcm9tUmVjZW50c1Jlc3BvbnNlIhbCtRgSCgIiAAoCGgAKAioACgISADgBEu0BCg9MaXN0T3JnUHJvamVjdHMSNi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTGlzdE9yZ1Byb2plY3RzUmVxdWVzdBo3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5MaXN0T3JnUHJvamVjdHNSZXNwb25zZSJpurUYPUIGCgR0eXBlQhAKDnB1Ymxpc2hlZF9vbmx5QggKBmN1cnNvchIXL3YxL2Rlc2lnbi9vcmcvcHJvamVjdHPCtRgkCgIiAAoCGgAKAioACgISABoQdXNlcjpkZXNpZ246cmVhZDgBEsYBCg5HZXRPcmdTZXR0aW5ncxI1LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HZXRPcmdTZXR0aW5nc1JlcXVlc3QaNi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2V0T3JnU2V0dGluZ3NSZXNwb25zZSJFurUYGRIXL3YxL2Rlc2lnbi9vcmcvc2V0dGluZ3PCtRgkCgIiAAoCGgAKAioACgISABoQdXNlcjpkZXNpZ246cmVhZDgBEsABChFVcGRhdGVPcmdTZXR0aW5ncxI4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5VcGRhdGVPcmdTZXR0aW5nc1JlcXVlc3QaOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuVXBkYXRlT3JnU2V0dGluZ3NSZXNwb25zZSI2urUYHDoBKhoXL3YxL2Rlc2lnbi9vcmcvc2V0dGluZ3PCtRgSCgIiAAoCGgAKAioACgISADgBEsoBCg9HZXRVc2VyU2V0dGluZ3MSNi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2V0VXNlclNldHRpbmdzUmVxdWVzdBo3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HZXRVc2VyU2V0dGluZ3NSZXNwb25zZSJGurUYGhIYL3YxL2Rlc2lnbi91c2VyL3NldHRpbmdzwrUYJAoCIgAKAhoACgIqAAoCEgAaEHVzZXI6ZGVzaWduOnJlYWQ4ARK4AQoSVXBkYXRlVXNlclNldHRpbmdzEjkuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwZGF0ZVVzZXJTZXR0aW5nc1JlcXVlc3QaOi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuVXBkYXRlVXNlclNldHRpbmdzUmVzcG9uc2UiK7q1GB06ASoaGC92MS9kZXNpZ24vdXNlci9zZXR0aW5nc8K1GAYKAiIAOAES6wEKCUxpc3RGaWxlcxIwLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5MaXN0RmlsZXNSZXF1ZXN0GjEuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkxpc3RGaWxlc1Jlc3BvbnNlInm6tRhNQgYKBHBhdGhCBwoFZGVwdGhCCAoGb2Zmc2V0QggKBmZpbHRlchImL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vZmlsZXPCtRgkCgIiAAoCGgAKAioACgISABoQdXNlcjpkZXNpZ246cmVhZDgBEscBCgdHZXRGaWxlEi4uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldEZpbGVSZXF1ZXN0Gi8uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldEZpbGVSZXNwb25zZSJburUYLzoBKiIqL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vZmlsZXMvZ2V0wrUYJAoCIgAKAhoACgIqAAoCEgAaEHVzZXI6ZGVzaWduOnJlYWQ4ARK6AQoKV3JpdGVGaWxlcxIxLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Xcml0ZUZpbGVzUmVxdWVzdBoyLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Xcml0ZUZpbGVzUmVzcG9uc2UiRbq1GCs6ASoiJi92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L2ZpbGVzwrUYEgoCIgAKAhoACgIqAAoCEgA4ARLBAQoKRGVsZXRlRmlsZRIxLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5EZWxldGVGaWxlUmVxdWVzdBoyLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5EZWxldGVGaWxlUmVzcG9uc2UiTLq1GDI6ASoiLS92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L2ZpbGVzL2RlbGV0ZcK1GBIKAiIACgIaAAoCKgAKAhIAOAESygEKC0RlbGV0ZUZpbGVzEjIuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlbGV0ZUZpbGVzUmVxdWVzdBozLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5EZWxldGVGaWxlc1Jlc3BvbnNlIlK6tRg4OgEqIjMvdjEvZGVzaWduL3Byb2plY3RzL3twcm9qZWN0X2lkfS9maWxlcy9kZWxldGUtYmF0Y2jCtRgSCgIiAAoCGgAKAioACgISADgBErkBCghDb3B5RmlsZRIvLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Db3B5RmlsZVJlcXVlc3QaMC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ29weUZpbGVSZXNwb25zZSJKurUYMDoBKiIrL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vZmlsZXMvY29wecK1GBIKAiIACgIaAAoCKgAKAhIAOAESuQEKCEVkaXRGaWxlEi8uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkVkaXRGaWxlUmVxdWVzdBowLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5FZGl0RmlsZVJlc3BvbnNlIkq6tRgwOgEqIisvdjEvZGVzaWduL3Byb2plY3RzL3twcm9qZWN0X2lkfS9maWxlcy9lZGl0wrUYEgoCIgAKAhoACgIqAAoCEgA4ARKdAQoQQ3JlYXRlRmlsZVN0cmVhbRI3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DcmVhdGVGaWxlU3RyZWFtUmVxdWVzdBo4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DcmVhdGVGaWxlU3RyZWFtUmVzcG9uc2UiFsK1GBIKAiIACgIaAAoCKgAKAhIAOAESmgEKD1dyaXRlRmlsZVN0cmVhbRI2LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Xcml0ZUZpbGVTdHJlYW1SZXF1ZXN0GjcuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLldyaXRlRmlsZVN0cmVhbVJlc3BvbnNlIhbCtRgSCgIiAAoCGgAKAioACgISADgBEpoBCg9BYm9ydEZpbGVTdHJlYW0SNi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQWJvcnRGaWxlU3RyZWFtUmVxdWVzdBo3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5BYm9ydEZpbGVTdHJlYW1SZXNwb25zZSIWwrUYEgoCIgAKAhoACgIqAAoCEgA4ARLOAQoJR3JlcEZpbGVzEjAuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdyZXBGaWxlc1JlcXVlc3QaMS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR3JlcEZpbGVzUmVzcG9uc2UiXLq1GDA6ASoiKy92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L2ZpbGVzL2dyZXDCtRgkCgIiAAoCGgAKAioACgISABoQdXNlcjpkZXNpZ246cmVhZDgBEo0BCgpVcGxvYWRGaWxlEjEuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwbG9hZEZpbGVSZXF1ZXN0GjIuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlVwbG9hZEZpbGVSZXNwb25zZSIWwrUYEgoCIgAKAhoACgIqAAoCEgA4ASgBEt8BChFMaXN0UHJvamVjdEFzc2V0cxI4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5MaXN0UHJvamVjdEFzc2V0c1JlcXVlc3QaOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTGlzdFByb2plY3RBc3NldHNSZXNwb25zZSJVurUYKRInL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vYXNzZXRzwrUYJAoCIgAKAhoACgIqAAoCEgAaEHVzZXI6ZGVzaWduOnJlYWQ4ARK+AQoLUmVjb3JkQXNzZXQSMi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUmVjb3JkQXNzZXRSZXF1ZXN0GjMuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlJlY29yZEFzc2V0UmVzcG9uc2UiRrq1GCw6ASoiJy92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L2Fzc2V0c8K1GBIKAiIACgIaAAoCKgAKAhIAOAESzgEKDlNldEFzc2V0U3RhdHVzEjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlNldEFzc2V0U3RhdHVzUmVxdWVzdBo2LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5TZXRBc3NldFN0YXR1c1Jlc3BvbnNlIk26tRgzOgEqGi4vdjEvZGVzaWduL3Byb2plY3RzL3twcm9qZWN0X2lkfS9hc3NldHMvc3RhdHVzwrUYEgoCIgAKAhoACgIqAAoCEgA4ARLFAQoLRGVsZXRlQXNzZXQSMi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRGVsZXRlQXNzZXRSZXF1ZXN0GjMuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlbGV0ZUFzc2V0UmVzcG9uc2UiTbq1GDM6ASoiLi92MS9kZXNpZ24vcHJvamVjdHMve3Byb2plY3RfaWR9L2Fzc2V0cy9kZWxldGXCtRgSCgIiAAoCGgAKAioACgISADgBEpMBCgRDaGF0EisuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNoYXRSZXF1ZXN0GiwuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkNoYXRSZXNwb25zZSIuurUYKjoBKiIlL3YxL2Rlc2lnbi9wcm9qZWN0cy97cHJvamVjdF9pZH0vY2hhdDABEpgBCgtDb3VudFRva2VucxIyLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Db3VudFRva2Vuc1JlcXVlc3QaMy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ291bnRUb2tlbnNSZXNwb25zZSIgurUYHDoBKiIXL3YxL2Rlc2lnbi9jb3VudC10b2tlbnMSngEKDkZpZ21hU3RhcnRBdXRoEjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkZpZ21hU3RhcnRBdXRoUmVxdWVzdBo2LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5GaWdtYVN0YXJ0QXV0aFJlc3BvbnNlIh26tRgZOgEqIhQvdjEvZGVzaWduL2ZpZ21hLW1jcBKbAQoORmlnbWFHZXRTdGF0dXMSNS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRmlnbWFHZXRTdGF0dXNSZXF1ZXN0GjYuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkZpZ21hR2V0U3RhdHVzUmVzcG9uc2UiGrq1GBYSFC92MS9kZXNpZ24vZmlnbWEtbWNwEp4BCg9GaWdtYURpc2Nvbm5lY3QSNi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRmlnbWFEaXNjb25uZWN0UmVxdWVzdBo3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5GaWdtYURpc2Nvbm5lY3RSZXNwb25zZSIaurUYFioUL3YxL2Rlc2lnbi9maWdtYS1tY3ASsAEKEUZpZ21hRXhjaGFuZ2VDb2RlEjguYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkZpZ21hRXhjaGFuZ2VDb2RlUmVxdWVzdBo5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5GaWdtYUV4Y2hhbmdlQ29kZVJlc3BvbnNlIia6tRgiOgEqIh0vdjEvZGVzaWduL2ZpZ21hLW1jcC9leGNoYW5nZRKhAQoORmlnbWFMaXN0VG9vbHMSNS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRmlnbWFMaXN0VG9vbHNSZXF1ZXN0GjYuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkZpZ21hTGlzdFRvb2xzUmVzcG9uc2UiILq1GBwSGi92MS9kZXNpZ24vZmlnbWEtbWNwL3Rvb2xzEqUBCg1GaWdtYUNhbGxUb29sEjQuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkZpZ21hQ2FsbFRvb2xSZXF1ZXN0GjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkZpZ21hQ2FsbFRvb2xSZXNwb25zZSInurUYIzoBKiIeL3YxL2Rlc2lnbi9maWdtYS1tY3AvY2FsbC10b29sEp4BCg9Hb29nbGVTdGFydEF1dGgSNi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR29vZ2xlU3RhcnRBdXRoUmVxdWVzdBo3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Hb29nbGVTdGFydEF1dGhSZXNwb25zZSIaurUYFjoBKiIRL3YxL2Rlc2lnbi9nb29nbGUSmwEKD0dvb2dsZUdldFN0YXR1cxI2LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Hb29nbGVHZXRTdGF0dXNSZXF1ZXN0GjcuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdvb2dsZUdldFN0YXR1c1Jlc3BvbnNlIhe6tRgTEhEvdjEvZGVzaWduL2dvb2dsZRKeAQoQR29vZ2xlRGlzY29ubmVjdBI3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Hb29nbGVEaXNjb25uZWN0UmVxdWVzdBo4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Hb29nbGVEaXNjb25uZWN0UmVzcG9uc2UiF7q1GBMqES92MS9kZXNpZ24vZ29vZ2xlErABChJHb29nbGVFeGNoYW5nZUNvZGUSOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR29vZ2xlRXhjaGFuZ2VDb2RlUmVxdWVzdBo6LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Hb29nbGVFeGNoYW5nZUNvZGVSZXNwb25zZSIjurUYHzoBKiIaL3YxL2Rlc2lnbi9nb29nbGUvZXhjaGFuZ2USjQEKEkdvb2dsZVVwbG9hZFNsaWRlcxI5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Hb29nbGVVcGxvYWRTbGlkZXNSZXF1ZXN0GjouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdvb2dsZVVwbG9hZFNsaWRlc1Jlc3BvbnNlIgASnAEKF0dvb2dsZVN0YXJ0U2xpZGVzVXBsb2FkEj4uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdvb2dsZVN0YXJ0U2xpZGVzVXBsb2FkUmVxdWVzdBo/LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5Hb29nbGVTdGFydFNsaWRlc1VwbG9hZFJlc3BvbnNlIgASngEKD0dpdGh1YlN0YXJ0QXV0aBI2LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HaXRodWJTdGFydEF1dGhSZXF1ZXN0GjcuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdpdGh1YlN0YXJ0QXV0aFJlc3BvbnNlIhq6tRgWOgEqIhEvdjEvZGVzaWduL2dpdGh1YhKbAQoPR2l0aHViR2V0U3RhdHVzEjYuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdpdGh1YkdldFN0YXR1c1JlcXVlc3QaNy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2l0aHViR2V0U3RhdHVzUmVzcG9uc2UiF7q1GBMSES92MS9kZXNpZ24vZ2l0aHViEp4BChBHaXRodWJEaXNjb25uZWN0EjcuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdpdGh1YkRpc2Nvbm5lY3RSZXF1ZXN0GjguYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdpdGh1YkRpc2Nvbm5lY3RSZXNwb25zZSIXurUYEyoRL3YxL2Rlc2lnbi9naXRodWISsAEKEkdpdGh1YkV4Y2hhbmdlQ29kZRI5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HaXRodWJFeGNoYW5nZUNvZGVSZXF1ZXN0GjouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdpdGh1YkV4Y2hhbmdlQ29kZVJlc3BvbnNlIiO6tRgfOgEqIhovdjEvZGVzaWduL2dpdGh1Yi9leGNoYW5nZRKhAQoPR2l0aHViTGlzdFJlcG9zEjYuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdpdGh1Ykxpc3RSZXBvc1JlcXVlc3QaNy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2l0aHViTGlzdFJlcG9zUmVzcG9uc2UiHbq1GBkSFy92MS9kZXNpZ24vZ2l0aHViL3JlcG9zEs4BCg1HaXRodWJHZXRUcmVlEjQuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdpdGh1YkdldFRyZWVSZXF1ZXN0GjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdpdGh1YkdldFRyZWVSZXNwb25zZSJQurUYTEIHCgVvd25lckIGCgRyZXBvQgUKA3JlZkINCgtwYXRoX3ByZWZpeEILCglyZWN1cnNpdmUSFi92MS9kZXNpZ24vZ2l0aHViL3RyZWUSvQEKDkdpdGh1YlJlYWRGaWxlEjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdpdGh1YlJlYWRGaWxlUmVxdWVzdBo2LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HaXRodWJSZWFkRmlsZVJlc3BvbnNlIjy6tRg4QgcKBW93bmVyQgYKBHJlcG9CBQoDcmVmQgYKBHBhdGgSFi92MS9kZXNpZ24vZ2l0aHViL2ZpbGUSqAEKEEdpdGh1YkltcG9ydFJlcG8SNy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2l0aHViSW1wb3J0UmVwb1JlcXVlc3QaOC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2l0aHViSW1wb3J0UmVwb1Jlc3BvbnNlIiG6tRgdOgEqIhgvdjEvZGVzaWduL2dpdGh1Yi9pbXBvcnQSpQEKEE1jcExpc3RDb25uZWN0ZWQSNy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTWNwTGlzdENvbm5lY3RlZFJlcXVlc3QaOC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTWNwTGlzdENvbm5lY3RlZFJlc3BvbnNlIh66tRgaEhgvdjEvZGVzaWduL21jcC9jb25uZWN0ZWQSwAEKEU1jcExpc3RDb25uZWN0b3JzEjguYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLk1jcExpc3RDb25uZWN0b3JzUmVxdWVzdBo5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5NY3BMaXN0Q29ubmVjdG9yc1Jlc3BvbnNlIja6tRgyQhUKE2luY2x1ZGVfdW5jb25uZWN0ZWQSGS92MS9kZXNpZ24vbWNwL2Nvbm5lY3RvcnMS0wEKG01jcExpc3REZXNpZ25JbXBvcnRQYXJ0bmVycxJCLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5NY3BMaXN0RGVzaWduSW1wb3J0UGFydG5lcnNSZXF1ZXN0GkMuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLk1jcExpc3REZXNpZ25JbXBvcnRQYXJ0bmVyc1Jlc3BvbnNlIiu6tRgnEiUvdjEvZGVzaWduL21jcC9kZXNpZ24taW1wb3J0LXBhcnRuZXJzEqoBCgxNY3BMaXN0VG9vbHMSMy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTWNwTGlzdFRvb2xzUmVxdWVzdBo0LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5NY3BMaXN0VG9vbHNSZXNwb25zZSIvurUYK0ITChFjbGllbnRfc2Vzc2lvbl9pZBIUL3YxL2Rlc2lnbi9tY3AvdG9vbHMSgwEKDk1jcFN0cmVhbVRvb2xzEjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLk1jcFN0cmVhbVRvb2xzUmVxdWVzdBo2LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5NY3BTdHJlYW1Ub29sc1Jlc3BvbnNlIgAwARKUAQoLTWNwQ2FsbFRvb2wSMi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTWNwQ2FsbFRvb2xSZXF1ZXN0GjMuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLk1jcENhbGxUb29sUmVzcG9uc2UiHLq1GBg6ASoiEy92MS9kZXNpZ24vbWNwL2NhbGwSnQEKDkxpc3RVc2VyU2tpbGxzEjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkxpc3RVc2VyU2tpbGxzUmVxdWVzdBo2LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5MaXN0VXNlclNraWxsc1Jlc3BvbnNlIhy6tRgYEhYvdjEvZGVzaWduL3VzZXItc2tpbGxzEtMBChhHZXRVc2VyU2tpbGxJbnN0cnVjdGlvbnMSPy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2V0VXNlclNraWxsSW5zdHJ1Y3Rpb25zUmVxdWVzdBpALmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HZXRVc2VyU2tpbGxJbnN0cnVjdGlvbnNSZXNwb25zZSI0urUYMBIuL3YxL2Rlc2lnbi91c2VyLXNraWxscy97c2tpbGxfaWR9L2luc3RydWN0aW9ucxKoAQoKVHJhY2tFdmVudBIxLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5UcmFja0V2ZW50UmVxdWVzdBoyLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5UcmFja0V2ZW50UmVzcG9uc2UiM7q1GBk6ASoiFC92MS9kZXNpZ24vdGVsZW1ldHJ5wrUYEgoCIgAKAhoACgIqAAoCEgA4ARK/AQoQR2V0Q3JlZGl0QnVuZGxlcxI3LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HZXRDcmVkaXRCdW5kbGVzUmVxdWVzdBo4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HZXRDcmVkaXRCdW5kbGVzUmVzcG9uc2UiOLq1GBwSGi92MS9kZXNpZ24vYmlsbGluZy9idW5kbGVzwrUYFBoQdXNlcjpkZXNpZ246cmVhZDgBEsYBChBHZXRQYXltZW50TWV0aG9kEjcuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldFBheW1lbnRNZXRob2RSZXF1ZXN0GjguYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldFBheW1lbnRNZXRob2RSZXNwb25zZSI/urUYIxIhL3YxL2Rlc2lnbi9iaWxsaW5nL3BheW1lbnQtbWV0aG9kwrUYFBoQdXNlcjpkZXNpZ246cmVhZDgBEsIBChFHZXRQcmVwYWlkQmFsYW5jZRI4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HZXRQcmVwYWlkQmFsYW5jZVJlcXVlc3QaOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuR2V0UHJlcGFpZEJhbGFuY2VSZXNwb25zZSI4urUYHBIaL3YxL2Rlc2lnbi9iaWxsaW5nL2JhbGFuY2XCtRgUGhB1c2VyOmRlc2lnbjpyZWFkOAESxwEKE1NldHVwT3ZlcmFnZUJpbGxpbmcSOi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU2V0dXBPdmVyYWdlQmlsbGluZ1JlcXVlc3QaOy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU2V0dXBPdmVyYWdlQmlsbGluZ1Jlc3BvbnNlIje6tRglOgEqIiAvdjEvZGVzaWduL2JpbGxpbmcvb3ZlcmFnZS9zZXR1cMK1GAoKAiIACgIqADgBErsBChFTZXRPdmVyYWdlRW5hYmxlZBI4LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5TZXRPdmVyYWdlRW5hYmxlZFJlcXVlc3QaOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU2V0T3ZlcmFnZUVuYWJsZWRSZXNwb25zZSIxurUYHzoBKhoaL3YxL2Rlc2lnbi9iaWxsaW5nL292ZXJhZ2XCtRgKCgIiAAoCKgA4ARK+AQoPUHVyY2hhc2VDcmVkaXRzEjYuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlB1cmNoYXNlQ3JlZGl0c1JlcXVlc3QaNy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUHVyY2hhc2VDcmVkaXRzUmVzcG9uc2UiOrq1GCg6ASoiIy92MS9kZXNpZ24vYmlsbGluZy9jcmVkaXRzL3B1cmNoYXNlwrUYCgoCIgAKAioAOAES0AEKEUdldFB1cmNoYXNlU3RhdHVzEjguYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldFB1cmNoYXNlU3RhdHVzUmVxdWVzdBo5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HZXRQdXJjaGFzZVN0YXR1c1Jlc3BvbnNlIka6tRgqEigvdjEvZGVzaWduL2JpbGxpbmcvY3JlZGl0cy97cHVyY2hhc2VfaWR9wrUYFBoQdXNlcjpkZXNpZ246cmVhZDgBEsUBChJDcmVhdGVBZG1pblJlcXVlc3QSOS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuQ3JlYXRlQWRtaW5SZXF1ZXN0UmVxdWVzdBo6LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5DcmVhdGVBZG1pblJlcXVlc3RSZXNwb25zZSI4urUYJjoBKiIhL3YxL2Rlc2lnbi9iaWxsaW5nL2FkbWluLXJlcXVlc3RzwrUYCgoCIgAKAioAOAESmQEKFlNlbmRNdWx0aXBsYXllck1lc3NhZ2USPS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU2VuZE11bHRpcGxheWVyTWVzc2FnZVJlcXVlc3QaPi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU2VuZE11bHRpcGxheWVyTWVzc2FnZVJlc3BvbnNlIgAScgoJUmVuZXdUdXJuEjAuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLlJlbmV3VHVyblJlcXVlc3QaMS5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUmVuZXdUdXJuUmVzcG9uc2UiABJ4CgtSZWxlYXNlVHVybhIyLmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5SZWxlYXNlVHVyblJlcXVlc3QaMy5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuUmVsZWFzZVR1cm5SZXNwb25zZSIAEp0BCg5TdWJtaXRGZWVkYmFjaxI1LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5TdWJtaXRGZWVkYmFja1JlcXVlc3QaNi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuU3VibWl0RmVlZGJhY2tSZXNwb25zZSIcurUYGDoBKiITL3YxL2Rlc2lnbi9mZWVkYmFjaxodorYYGQoCCAMaEXVzZXI6ZGVzaWduOndyaXRlOAEy7w4KFE9tZWxldHRlQWRtaW5TZXJ2aWNlEs0BCg1EZWxldGVBY2NvdW50EjQuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlbGV0ZUFjY291bnRSZXF1ZXN0GjUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlbGV0ZUFjY291bnRSZXNwb25zZSJPwrUYLQoCKgAqJQoRcHJpdmFjeV9vcGVyYXRpb24SEGFjY291bnRfZGVsZXRpb244Afq1GBoKGAoWYWNjcGxhdC1hc3luYy1zdmMtYWNjdBLYAQoSRGVsZXRlT3JnYW5pemF0aW9uEjkuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkRlbGV0ZU9yZ2FuaXphdGlvblJlcXVlc3QaOi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuRGVsZXRlT3JnYW5pemF0aW9uUmVzcG9uc2UiS8K1GCkKAioAKiEKEXByaXZhY3lfb3BlcmF0aW9uEgxvcmdfZGVsZXRpb244Afq1GBoKGAoWYWNjcGxhdC1hc3luYy1zdmMtYWNjdBLWAQoSTGlzdENoYXRzRm9yRXhwb3J0EjkuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkxpc3RDaGF0c0ZvckV4cG9ydFJlcXVlc3QaOi5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTGlzdENoYXRzRm9yRXhwb3J0UmVzcG9uc2UiScK1GCcKAioAKh8KEXByaXZhY3lfb3BlcmF0aW9uEgpvcmdfZXhwb3J0OAH6tRgaChgKFmFjY3BsYXQtYXN5bmMtc3ZjLWFjY3QS1gEKEkV4cG9ydENoYXRNZXNzYWdlcxI5LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5FeHBvcnRDaGF0TWVzc2FnZXNSZXF1ZXN0GjouYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkV4cG9ydENoYXRNZXNzYWdlc1Jlc3BvbnNlIknCtRgnCgIqACofChFwcml2YWN5X29wZXJhdGlvbhIKb3JnX2V4cG9ydDgB+rUYGgoYChZhY2NwbGF0LWFzeW5jLXN2Yy1hY2N0Es8CChlMaXN0UHJvamVjdHNGb3JDb21wbGlhbmNlEkAuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkxpc3RQcm9qZWN0c0ZvckNvbXBsaWFuY2VSZXF1ZXN0GkEuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkxpc3RQcm9qZWN0c0ZvckNvbXBsaWFuY2VSZXNwb25zZSKsAcK1GEQKAioAKjwKEXByaXZhY3lfb3BlcmF0aW9uEg9jb21wbGlhbmNlX3JlYWQSFmNvbXBsaWFuY2VfcmVhZF9wYXJlbnQ4Afq1GGAKFgoUcHJpdmF0ZS1hcGktc3ZjLWFjY3QKRgoUcHJpdmF0ZS1hcGktc3ZjLWFjY3QSGRIXc2NhbmRpdW0tZ2NwLXByb2QtY21oLTIaExIRcmVsZWFzZS1jYW5kaWRhdGUSyQIKF0dldFByb2plY3RGb3JDb21wbGlhbmNlEj4uYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkdldFByb2plY3RGb3JDb21wbGlhbmNlUmVxdWVzdBo/LmFudGhyb3BpYy5vbWVsZXR0ZS5hcGkudjFhbHBoYS5HZXRQcm9qZWN0Rm9yQ29tcGxpYW5jZVJlc3BvbnNlIqwBwrUYRAoCKgAqPAoRcHJpdmFjeV9vcGVyYXRpb24SD2NvbXBsaWFuY2VfcmVhZBIWY29tcGxpYW5jZV9yZWFkX3BhcmVudDgB+rUYYAoWChRwcml2YXRlLWFwaS1zdmMtYWNjdApGChRwcml2YXRlLWFwaS1zdmMtYWNjdBIZEhdzY2FuZGl1bS1nY3AtcHJvZC1jbWgtMhoTEhFyZWxlYXNlLWNhbmRpZGF0ZRLbAgodTGlzdFByb2plY3RGaWxlc0ZvckNvbXBsaWFuY2USRC5hbnRocm9waWMub21lbGV0dGUuYXBpLnYxYWxwaGEuTGlzdFByb2plY3RGaWxlc0ZvckNvbXBsaWFuY2VSZXF1ZXN0GkUuYW50aHJvcGljLm9tZWxldHRlLmFwaS52MWFscGhhLkxpc3RQcm9qZWN0RmlsZXNGb3JDb21wbGlhbmNlUmVzcG9uc2UirAHCtRhECgIqACo8ChFwcml2YWN5X29wZXJhdGlvbhIPY29tcGxpYW5jZV9yZWFkEhZjb21wbGlhbmNlX3JlYWRfcGFyZW50OAH6tRhgChYKFHByaXZhdGUtYXBpLXN2Yy1hY2N0CkYKFHByaXZhdGUtYXBpLXN2Yy1hY2N0EhkSF3NjYW5kaXVtLWdjcC1wcm9kLWNtaC0yGhMSEXJlbGVhc2UtY2FuZGlkYXRlYgZwcm90bzM`, [I(`Ch9hbnRocm9waWMvYW5ub3RhdGlvbnMvYXBpLnByb3RvEhVhbnRocm9waWMuYW5ub3RhdGlvbnMiiAEKG0Rpc2NyaW1pbmF0ZWRUeXBlQW5ub3RhdGlvbhINCgV2YWx1ZRgBIAEoCRIXCgpmaWVsZF9uYW1lGAIgASgJSACIAQESHQoQYnJlYWtnbGFzc19maWVsZBgDIAEoCUgBiAEBQg0KC19maWVsZF9uYW1lQhMKEV9icmVha2dsYXNzX2ZpZWxkIsYECg9GaWVsZEFubm90YXRpb24SEwoLcmVzdF9oaWRkZW4YASABKAgSDQoFYWxpYXMYAiABKAkSDgoGdW5wYWNrGAMgASgIEjcKBmdhdGluZxgEIAEoCzInLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5HYXRpbmdBbm5vdGF0aW9uEhEKCXNlbnNpdGl2ZRgFIAEoCBIQCghjYXRjaGFsbBgGIAEoCBISCgphdXRoX3Rva2VuGAcgASgIEiMKFnZlcnNpb25lZF9oZWFkZXJfdmFsdWUYCCABKAlIAIgBARIYCgtkZXNjcmlwdGlvbhgJIAEoCUgBiAEBEhMKC2JhcmVfc3RyaW5nGAogASgIEhQKDHNjaGVtYV9hbGlhcxgLIAEoCBJeCh1zdGFpbmxlc3NfcGFnaW5hdGlvbl9wcm9wZXJ0eRgMIAEoCzIyLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5TdGFpbmxlc3NQYWdpbmF0aW9uUHJvcGVydHlIAogBARIdChBvcGVuYXBpX251bGxhYmxlGA0gASgISAOIAQESJQoYc3RhaW5sZXNzX2NsaV9kYXRhX2FsaWFzGA4gASgJSASIAQFCGQoXX3ZlcnNpb25lZF9oZWFkZXJfdmFsdWVCDgoMX2Rlc2NyaXB0aW9uQiAKHl9zdGFpbmxlc3NfcGFnaW5hdGlvbl9wcm9wZXJ0eUITChFfb3BlbmFwaV9udWxsYWJsZUIbChlfc3RhaW5sZXNzX2NsaV9kYXRhX2FsaWFzIt8BChtTdGFpbmxlc3NQYWdpbmF0aW9uUHJvcGVydHkSSwoHcHVycG9zZRgBIAEoDjI6LmFudGhyb3BpYy5hbm5vdGF0aW9ucy5TdGFpbmxlc3NQYWdpbmF0aW9uUHJvcGVydHkuUHVycG9zZSJzCgdQdXJwb3NlEhcKE1BVUlBPU0VfVU5TUEVDSUZJRUQQABIRCg1QVVJQT1NFX0lURU1TEAESHQoZUFVSUE9TRV9ORVhUX0NVUlNPUl9GSUVMRBACEh0KGVBVUlBPU0VfTkVYVF9DVVJTT1JfUEFSQU0QAyKIAgoPT25lb2ZBbm5vdGF0aW9uEg4KBnVucGFjaxgBIAEoCBITCgtyZXN0X2hpZGRlbhgCIAEoCBIdChBicmVha2dsYXNzX2ZpZWxkGAMgASgJSACIAQESHQoQdmVyc2lvbmVkX2hlYWRlchgEIAEoCUgBiAEBEhUKCHJlcXVpcmVkGAYgASgISAKIAQESFgoJanNvbl9uYW1lGAcgASgJSAOIAQESDQoFdW5pb24YCCABKAhCEwoRX2JyZWFrZ2xhc3NfZmllbGRCEwoRX3ZlcnNpb25lZF9oZWFkZXJCCwoJX3JlcXVpcmVkQgwKCl9qc29uX25hbWVKBAgFEAZSCWNsZWFyYWJsZSJkCg5FbnVtQW5ub3RhdGlvbhIYCgtkZXNjcmlwdGlvbhgBIAEoCUgAiAEBEhgKC3NjaGVtYV9uYW1lGAIgASgJSAGIAQFCDgoMX2Rlc2NyaXB0aW9uQg4KDF9zY2hlbWFfbmFtZSJjChNFbnVtVmFsdWVBbm5vdGF0aW9uEg0KBWFsaWFzGAEgASgJEhMKC3Jlc3RfaGlkZGVuGAIgASgIEhgKC2Rlc2NyaXB0aW9uGAMgASgJSACIAQFCDgoMX2Rlc2NyaXB0aW9uItgBChFNZXNzYWdlQW5ub3RhdGlvbhIYCgtkZXNjcmlwdGlvbhgBIAEoCUgAiAEBEhgKC3NjaGVtYV9uYW1lGAMgASgJSAGIAQESGAoLanNvbl9zY2FsYXIYBCABKAlIAogBARJFChFkZXJpdmVfZmllbGRfbWFzaxgCIAEoCzIqLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5GaWVsZE1hc2tEZXJpdmF0aW9uQg4KDF9kZXNjcmlwdGlvbkIOCgxfc2NoZW1hX25hbWVCDgoMX2pzb25fc2NhbGFyIi0KE0ZpZWxkTWFza0Rlcml2YXRpb24SFgoOcmVzb3VyY2VfZmllbGQYASABKAkidAoPRXJyb3JBbm5vdGF0aW9uEhMKC2h0dHBfc3RhdHVzGAEgASgFEiYKDGNvbm5lY3RfY29kZRgCIAEoDjIQLmdvb2dsZS5ycGMuQ29kZRITCgt1c2VyX2ZhY2luZxgDIAEoCBIPCgdtZXNzYWdlGAQgASgJIikKClF1ZXJ5UGFyYW0SDAoEcGF0aBgBIAEoCRINCgVhbGlhcxgCIAEoCSLtAwoISFRUUFJ1bGUSDQoDZ2V0GAIgASgJSAASDQoDcHV0GAMgASgJSAASDgoEcG9zdBgEIAEoCUgAEhAKBmRlbGV0ZRgFIAEoCUgAEg8KBXBhdGNoGAYgASgJSAASDAoEYm9keRgHIAEoCRI3CgxxdWVyeV9wYXJhbXMYCCADKAsyIS5hbnRocm9waWMuYW5ub3RhdGlvbnMuUXVlcnlQYXJhbRIOCgZlcnJvcnMYCSADKAkSOgoRYWRkaXRpb25hbF9yb3V0ZXMYCyADKAsyHy5hbnRocm9waWMuYW5ub3RhdGlvbnMuSFRUUFJ1bGUSFAoHc3VtbWFyeRgMIAEoCUgBiAEBEhsKDnN1Y2Nlc3Nfc3RhdHVzGA0gASgFSAKIAQESGgoNcmVzcG9uc2VfYm9keRgOIAEoCUgDiAEBEigKG3JlamVjdF91bmtub3duX3F1ZXJ5X3BhcmFtcxgPIAEoCEgEiAEBEhgKC2Rlc2NyaXB0aW9uGBAgASgJSAWIAQFCCQoHcGF0dGVybkIKCghfc3VtbWFyeUIRCg9fc3VjY2Vzc19zdGF0dXNCEAoOX3Jlc3BvbnNlX2JvZHlCHgocX3JlamVjdF91bmtub3duX3F1ZXJ5X3BhcmFtc0IOCgxfZGVzY3JpcHRpb24iDAoKQXBpS2V5QXV0aCIQCg5PQXV0aFRva2VuQXV0aCIQCg5TZXNzaW9uS2V5QXV0aCIPCg1DdXN0b21Kd3RBdXRoIg0KC09ib2xKd3RBdXRoIg4KDEdvb2dsZVNhQXV0aCIqCgpDbGFpbUNoZWNrEgwKBG5hbWUYASABKAkSDgoGdmFsdWVzGAIgAygJIvIDCgRSdWxlEjQKBHR5cGUYASABKA4yIC5hbnRocm9waWMuYW5ub3RhdGlvbnMuUnVsZS5UeXBlQgIYAUgAEjQKB2FwaV9rZXkYAiABKAsyIS5hbnRocm9waWMuYW5ub3RhdGlvbnMuQXBpS2V5QXV0aEgAEjwKC29hdXRoX3Rva2VuGAMgASgLMiUuYW50aHJvcGljLmFubm90YXRpb25zLk9BdXRoVG9rZW5BdXRoSAASPAoLc2Vzc2lvbl9rZXkYBCABKAsyJS5hbnRocm9waWMuYW5ub3RhdGlvbnMuU2Vzc2lvbktleUF1dGhIABI6CgpjdXN0b21fand0GAUgASgLMiQuYW50aHJvcGljLmFubm90YXRpb25zLkN1c3RvbUp3dEF1dGhIABI2CghvYm9sX2p3dBgGIAEoCzIiLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5PYm9sSnd0QXV0aEgAEjgKCWdvb2dsZV9zYRgHIAEoCzIjLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5Hb29nbGVTYUF1dGhIACJFCgRUeXBlEhQKEFRZUEVfVU5TUEVDSUZJRUQQABISCgpQVUJMSUNfQVBJEAEaAggBEhMKC1BSSVZBVEVfQVBJEAMaAggBQg0KC2F1dGhfY29uZmlnIosFCgVBdXRobhIqCgVydWxlcxgBIAMoCzIbLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5SdWxlEhIKCm9wdGltaXN0aWMYAiABKAgSFwoPcmVxdWlyZWRfc2NvcGVzGAMgAygJEjoKD3JlcXVpcmVkX2NsYWltcxgFIAMoCzIhLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5DbGFpbUNoZWNrEjsKEGZvcmJpZGRlbl9jbGFpbXMYBiADKAsyIS5hbnRocm9waWMuYW5ub3RhdGlvbnMuQ2xhaW1DaGVjaxITCgZzdHJpY3QYByABKAhIAIgBARIeChZleHRyYWN0X3RlbmFudF9jb250ZXh0GAggASgIEi4KIWRhbmdlcm91c2x5X2FsbG93X2FueV9vYXV0aF9zY29wZRgJIAEoCEgBiAEBEiMKFnJlcXVpcmVzX3JlcXVlc3RfdG9rZW4YCiABKAhIAogBARJMChllZGdlX2F1dGhlbnRpY2F0aW9uX3R5cGVzGAsgAygOMikuYW50aHJvcGljLmFubm90YXRpb25zLkVkZ2VDcmVkZW50aWFsVHlwZRIfChJzY29wZV9lbmZvcmNlX2dhdGUYDCABKAlIA4gBARIkChxyZXF1aXJlZF91bmlmaWVkX3Blcm1pc3Npb25zGA0gAygJEigKIHJlcXVpcmVkX3VuaWZpZWRfcGVybWlzc2lvbnNfYW55GA4gAygJQgkKB19zdHJpY3RCJAoiX2Rhbmdlcm91c2x5X2FsbG93X2FueV9vYXV0aF9zY29wZUIZChdfcmVxdWlyZXNfcmVxdWVzdF90b2tlbkIVChNfc2NvcGVfZW5mb3JjZV9nYXRlSgQIBBAFIlgKDkNsaWVudERlZmF1bHRzEhMKC2RlYWRsaW5lX21zGAEgASgNEjEKBXJldHJ5GAIgASgLMiIuYW50aHJvcGljLmFubm90YXRpb25zLlJldHJ5UG9saWN5InsKC1JldHJ5UG9saWN5EhQKDG1heF9hdHRlbXB0cxgBIAEoDRIiCghyZXRyeV9vbhgCIAMoDjIQLmdvb2dsZS5ycGMuQ29kZRIaChJpbml0aWFsX2JhY2tvZmZfbXMYAyABKA0SFgoObWF4X2JhY2tvZmZfbXMYBCABKA0iTgoLV29ya2F0b1J1bGUSDgoGZXhwb3NlGAEgASgIEhQKDGFjdGlvbl90aXRsZRgCIAEoCRIZChFjb25uZWN0aW9uX3Njb3BlcxgDIAMoCSrXAQoSRWRnZUNyZWRlbnRpYWxUeXBlEiQKIEVER0VfQ1JFREVOVElBTF9UWVBFX1VOU1BFQ0lGSUVEEAASIAocRURHRV9DUkVERU5USUFMX1RZUEVfQVBJX0tFWRABEiQKIEVER0VfQ1JFREVOVElBTF9UWVBFX09BVVRIX1RPS0VOEAISJAogRURHRV9DUkVERU5USUFMX1RZUEVfU0VTU0lPTl9LRVkQAxItCilFREdFX0NSRURFTlRJQUxfVFlQRV9KV1RfQkVBUkVSX0FTU0VSVElPThAEOmQKDXNlcnZpY2VfYXV0aG4SHy5nb29nbGUucHJvdG9idWYuU2VydmljZU9wdGlvbnMY5IYDIAEoCzIcLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5BdXRoblIMc2VydmljZUF1dGhuOnEKD2NsaWVudF9kZWZhdWx0cxIfLmdvb2dsZS5wcm90b2J1Zi5TZXJ2aWNlT3B0aW9ucxjlhgMgASgLMiUuYW50aHJvcGljLmFubm90YXRpb25zLkNsaWVudERlZmF1bHRzUg5jbGllbnREZWZhdWx0czqEAQoSZGlzY3JpbWluYXRlZF90eXBlEh8uZ29vZ2xlLnByb3RvYnVmLk1lc3NhZ2VPcHRpb25zGNWGAyABKAsyMi5hbnRocm9waWMuYW5ub3RhdGlvbnMuRGlzY3JpbWluYXRlZFR5cGVBbm5vdGF0aW9uUhFkaXNjcmltaW5hdGVkVHlwZTpfCgVlcnJvchIfLmdvb2dsZS5wcm90b2J1Zi5NZXNzYWdlT3B0aW9ucxjahgMgASgLMiYuYW50aHJvcGljLmFubm90YXRpb25zLkVycm9yQW5ub3RhdGlvblIFZXJyb3I6dAoPbWVzc2FnZV9vcHRpb25zEh8uZ29vZ2xlLnByb3RvYnVmLk1lc3NhZ2VPcHRpb25zGNyGAyABKAsyKC5hbnRocm9waWMuYW5ub3RhdGlvbnMuTWVzc2FnZUFubm90YXRpb25SDm1lc3NhZ2VPcHRpb25zOmwKDWZpZWxkX29wdGlvbnMSHS5nb29nbGUucHJvdG9idWYuRmllbGRPcHRpb25zGNaGAyABKAsyJi5hbnRocm9waWMuYW5ub3RhdGlvbnMuRmllbGRBbm5vdGF0aW9uUgxmaWVsZE9wdGlvbnM6bAoNb25lb2Zfb3B0aW9ucxIdLmdvb2dsZS5wcm90b2J1Zi5PbmVvZk9wdGlvbnMY2IYDIAEoCzImLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5PbmVvZkFubm90YXRpb25SDG9uZW9mT3B0aW9uczpoCgxlbnVtX29wdGlvbnMSHC5nb29nbGUucHJvdG9idWYuRW51bU9wdGlvbnMY3oYDIAEoCzIlLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5FbnVtQW5ub3RhdGlvblILZW51bU9wdGlvbnM6fQoSZW51bV92YWx1ZV9vcHRpb25zEiEuZ29vZ2xlLnByb3RvYnVmLkVudW1WYWx1ZU9wdGlvbnMY2YYDIAEoCzIqLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5FbnVtVmFsdWVBbm5vdGF0aW9uUhBlbnVtVmFsdWVPcHRpb25zOlUKBGh0dHASHi5nb29nbGUucHJvdG9idWYuTWV0aG9kT3B0aW9ucxjXhgMgASgLMh8uYW50aHJvcGljLmFubm90YXRpb25zLkhUVFBSdWxlUgRodHRwOlQKBWF1dGhuEh4uZ29vZ2xlLnByb3RvYnVmLk1ldGhvZE9wdGlvbnMY2IYDIAEoCzIcLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5BdXRoblIFYXV0aG46YQoGZ2F0aW5nEh4uZ29vZ2xlLnByb3RvYnVmLk1ldGhvZE9wdGlvbnMY2oYDIAEoCzInLmFudGhyb3BpYy5hbm5vdGF0aW9ucy5HYXRpbmdBbm5vdGF0aW9uUgZnYXRpbmc6QQoLcmVzdF9oaWRkZW4SHi5nb29nbGUucHJvdG9idWYuTWV0aG9kT3B0aW9ucxjbhgMgASgIUgpyZXN0SGlkZGVuOl4KB3dvcmthdG8SHi5nb29nbGUucHJvdG9idWYuTWV0aG9kT3B0aW9ucxjmhgMgASgLMiIuYW50aHJvcGljLmFubm90YXRpb25zLldvcmthdG9SdWxlUgd3b3JrYXRvQlRaUmdpdGh1Yi5jb20vYW50aHJvcGljcy9hbnRocm9waWMvYXBpLWdvL2NtZC9wcm90b2MtZ2VuLWNvbm5lY3QtZ2F0ZXdheS1nby9wa2cvcHJvdG9iBnByb3RvMw`, [I(`CiBhbnRocm9waWMvYW5ub3RhdGlvbnMvYmV0YS5wcm90bxIVYW50aHJvcGljLmFubm90YXRpb25zIpYBChBHYXRpbmdBbm5vdGF0aW9uEjEKCGFueV9iZXRhGAEgAygOMh8uYW50aHJvcGljLmFubm90YXRpb25zLkJldGFHYXRlEj0KDmFueV9jYXBhYmlsaXR5GAIgAygOMiUuYW50aHJvcGljLmFubm90YXRpb25zLkNhcGFiaWxpdHlHYXRlEhAKCGludGVybmFsGAMgASgIKscKCghCZXRhR2F0ZRIZChVCRVRBX0dBVEVfVU5TUEVDSUZJRUQQABIXChNTRVNTSU9OU19QVUJMSUNfQVBJEAISGAoUV09SS0ZMT1dTX1BVQkxJQ19BUEkQAxIdChlTRVNTSU9OU19QVUJMSUNfQVBJX1ZORVhUEAUSDgoKQUdFTlRfVEFTSxAGEggKBFNBTFQQBxIQCgxDQ1JfVFJJR0dFUlMQCBITCg9PVVRDT01FU19QUk9NUFQQCRIVChFPVVRDT01FU19TVUJBR0VOVBAKEhQKEEFHRU5UX01FTU9SWV9FQVAQDBIaChZDVVNUT01fQUdFTlRTX1BMQVRGT1JNEA0SFwoTV0VCSE9PS1NfUFVCTElDX0FQSRAOEhEKDVVTRVJfUFJPRklMRVMQDxIRCg1TRVNTSU9OX0hPT0tTEBASFwoTU0VTU0lPTl9UT09MX0VWRU5UUxAREhgKFE1PREVMX1JFUVVFU1RfRVZFTlRTEBISGAoUVU5WRVJTSU9ORURfVE9PTFNFVFMQExITCg9TRVNTSU9OX1RIUkVBRFMQFBIZChVTRVNTSU9OX1JFU09VUkNFU19BUEkQFRITCg9DQUxMQUJMRV9BR0VOVFMQFhISCg5BR0VOVF9SRVNPVVJDRRAXEhIKDkFHRU5UX09VVENPTUVTEBgSEgoOTUFOQUdFRF9BR0VOVFMQGRIWChJBR0VOVF9NRU1PUllfTU9VTlQQGhIRCg1TRVNTSU9OX1ZBVUxUEBsSHAoYRU5WSVJPTk1FTlRTX1NFTEZfSE9TVEVEEBwSIwofRU5WSVJPTk1FTlRTX1NFTEZfSE9TVEVEX0xFR0FDWRAdEg4KCkNMQVVERV9DT1MQHhIgChxBR0VOVF9NRU1PUllfUFJPTVBUX09WRVJSSURFEB8SIQodQUdFTlRfTUVNT1JZX1JFU0VBUkNIX1BSRVZJRVcQIBIKCgZPUEVST04QIRITCg9DQ19ST1VUSU5FX0ZJUkUQIhINCglGQVNUX01PREUQIxIgChxBQ0NPVU5UX1NDT1BFRF9NRU1PUllfU1RPUkVTECUSFgoSTUlEX1NFU1NJT05fVVBEQVRFECYSHAoYQUdFTlRfTUVNT1JZX1BVQkxJQ19CRVRBECcSDgoKRFJFQU1TX0FQSRApEg8KC0RFUExPWU1FTlRTECoSDgoKTVVMVElBR0VOVBArEhoKFlNFU1NJT05fVkFVTFRfVkFMSURBVEUQLBIeChpTRVNTSU9OX1ZBVUxUX1NBTkRCT1hfQ1JFRBAtEhEKDVNFQ1VSSVRZX1NDQU4QLhIRCg1PVVRDT01FU19CRVRBEC8SFgoSU0hFTExfQUdFTlRfREVMRVRFEDASEQoNU0VDVVJJVFlfTEFCUxAxEhUKEVNFU1NJT05fU1RSRUFNSU5HEDISDwoLTUNQX1RVTk5FTFMQMxIVChFTRVNTSU9OX1BSRVZfUEFHRRA0EhgKFFNFU1NJT05fU1lTVEVNX0VWRU5UEDUSGgoWU0VTU0lPTl9JTklUSUFMX0VWRU5UUxA2EiAKHFNFU1NJT05fVkFVTFRfQ1JFRF9JTkpFQ1RJT04QNxIbChdTRVNTSU9OX0FHRU5UX09WRVJSSURFUxA4EhAKDE1PREVMX0VGRk9SVBA5IgQIARABIgQIBBAEIgQICxALIgQIJBAkIgQIKBAoKghDQ1JfQllPQyoaU0VTU0lPTlNfREVMRVRFX1BVQkxJQ19BUEkqBVZBVUxUKgdSRVZFUklFKhRTVVBFUl9TRVNTSU9OX0NSRUFURSoxCg5DYXBhYmlsaXR5R2F0ZRIfChtDQVBBQklMSVRZX0dBVEVfVU5TUEVDSUZJRUQQAEJUWlJnaXRodWIuY29tL2FudGhyb3BpY3MvYW50aHJvcGljL2FwaS1nby9jbWQvcHJvdG9jLWdlbi1jb25uZWN0LWdhdGV3YXktZ28vcGtnL3Byb3RvYgZwcm90bzM`, [Wn]), Wn, I(`ChVnb29nbGUvcnBjL2NvZGUucHJvdG8SCmdvb2dsZS5ycGMqtwIKBENvZGUSBgoCT0sQABINCglDQU5DRUxMRUQQARILCgdVTktOT1dOEAISFAoQSU5WQUxJRF9BUkdVTUVOVBADEhUKEURFQURMSU5FX0VYQ0VFREVEEAQSDQoJTk9UX0ZPVU5EEAUSEgoOQUxSRUFEWV9FWElTVFMQBhIVChFQRVJNSVNTSU9OX0RFTklFRBAHEhMKD1VOQVVUSEVOVElDQVRFRBAQEhYKElJFU09VUkNFX0VYSEFVU1RFRBAIEhcKE0ZBSUxFRF9QUkVDT05ESVRJT04QCRILCgdBQk9SVEVEEAoSEAoMT1VUX09GX1JBTkdFEAsSEQoNVU5JTVBMRU1FTlRFRBAMEgwKCElOVEVSTkFMEA0SDwoLVU5BVkFJTEFCTEUQDhINCglEQVRBX0xPU1MQD0JYCg5jb20uZ29vZ2xlLnJwY0IJQ29kZVByb3RvUAFaM2dvb2dsZS5nb2xhbmcub3JnL2dlbnByb3RvL2dvb2dsZWFwaXMvcnBjL2NvZGU7Y29kZaICA1JQQ2IGcHJvdG8z`)]), I(`CjdhbnRocm9waWMvd29ya2xvYWRhY2wvYW5ub3RhdGlvbnMvdjFhbHBoYS9zMnNfYWNsLnByb3RvEilhbnRocm9waWMud29ya2xvYWRhY2wuYW5ub3RhdGlvbnMudjFhbHBoYSLQAQoGUzJTQWNsElEKD2FsbG93ZWRfY2FsbGVycxgBIAMoCzI4LmFudGhyb3BpYy53b3JrbG9hZGFjbC5hbm5vdGF0aW9ucy52MWFscGhhLkFsbG93ZWRDYWxsZXISDgoGcHVibGljGAIgASgIEiUKHWFsbG93X2hvbWVzcGFjZXNfb3V0c2lkZV9wcm9kGAMgASgIEhUKDWNhbGxlcl9ncm91cHMYBCADKAkSJQodYWxsb3dfcHJfcHJldmlld19vdXRzaWRlX3Byb2QYBSABKAgiZgoLUzJTQWNsR3JvdXASDAoEbmFtZRgBIAEoCRJJCgdjYWxsZXJzGAIgAygLMjguYW50aHJvcGljLndvcmtsb2FkYWNsLmFubm90YXRpb25zLnYxYWxwaGEuQWxsb3dlZENhbGxlciJWCgxTMlNBY2xHcm91cHMSRgoGZ3JvdXBzGAEgAygLMjYuYW50aHJvcGljLndvcmtsb2FkYWNsLmFubm90YXRpb25zLnYxYWxwaGEuUzJTQWNsR3JvdXAimwIKDUFsbG93ZWRDYWxsZXISFwoPc2VydmljZV9hY2NvdW50GAEgASgJEkcKB2NsdXN0ZXIYAiABKAsyNi5hbnRocm9waWMud29ya2xvYWRhY2wuYW5ub3RhdGlvbnMudjFhbHBoYS5DYWxsZXJTY29wZRJJCgluYW1lc3BhY2UYAyABKAsyNi5hbnRocm9waWMud29ya2xvYWRhY2wuYW5ub3RhdGlvbnMudjFhbHBoYS5DYWxsZXJTY29wZRIqCh10cmVhdF9uYW1lc3BhY2VfYXNfcHJvZHVjdGlvbhgEIAEoCEgAiAEBEg8KB2Fuc191cmkYBSABKAlCIAoeX3RyZWF0X25hbWVzcGFjZV9hc19wcm9kdWN0aW9uInIKC0NhbGxlclNjb3BlEkoKCWNvbG9jYXRlZBgBIAEoDjI1LmFudGhyb3BpYy53b3JrbG9hZGFjbC5hbm5vdGF0aW9ucy52MWFscGhhLkNvbG9jYXRpb25IABIOCgRuYW1lGAIgASgJSABCBwoFc2NvcGUiXgoOUzJTQWNsRGVmYXVsdHMSJQodYWxsb3dfaG9tZXNwYWNlc19vdXRzaWRlX3Byb2QYASABKAgSJQodYWxsb3dfcHJfcHJldmlld19vdXRzaWRlX3Byb2QYAiABKAgqGwoKQ29sb2NhdGlvbhINCglDT0xPQ0FURUQQADpsCgdzMnNfYWNsEh4uZ29vZ2xlLnByb3RvYnVmLk1ldGhvZE9wdGlvbnMY34YDIAEoCzIxLmFudGhyb3BpYy53b3JrbG9hZGFjbC5hbm5vdGF0aW9ucy52MWFscGhhLlMyU0FjbFIGczJzQWNsOoYBChBzMnNfYWNsX2RlZmF1bHRzEh8uZ29vZ2xlLnByb3RvYnVmLlNlcnZpY2VPcHRpb25zGN+GAyABKAsyOS5hbnRocm9waWMud29ya2xvYWRhY2wuYW5ub3RhdGlvbnMudjFhbHBoYS5TMlNBY2xEZWZhdWx0c1IOczJzQWNsRGVmYXVsdHM6fQoOczJzX2FjbF9ncm91cHMSHC5nb29nbGUucHJvdG9idWYuRmlsZU9wdGlvbnMY34YDIAEoCzI3LmFudGhyb3BpYy53b3JrbG9hZGFjbC5hbm5vdGF0aW9ucy52MWFscGhhLlMyU0FjbEdyb3Vwc1IMczJzQWNsR3JvdXBzYgZwcm90bzM`, [Wn]), I(`ChtidWYvdmFsaWRhdGUvdmFsaWRhdGUucHJvdG8SDGJ1Zi52YWxpZGF0ZQ`), xr]),
    Fr = P(Pr, 123),
    Ir = function(e) {
        return e[e.UNSPECIFIED = 0] = `UNSPECIFIED`, e[e.SUCCESS = 1] = `SUCCESS`, e[e.REQUIRES_ACTION = 2] = `REQUIRES_ACTION`, e[e.PENDING = 3] = `PENDING`, e[e.FAILED = 4] = `FAILED`, e
    }({}),
    L = function(e) {
        return e[e.UNSPECIFIED = 0] = `UNSPECIFIED`, e[e.PROJECT = 1] = `PROJECT`, e[e.TEMPLATE = 2] = `TEMPLATE`, e[e.DESIGN_SYSTEM = 3] = `DESIGN_SYSTEM`, e
    }({}),
    Lr = function(e) {
        return e[e.UNSPECIFIED = 0] = `UNSPECIFIED`, e[e.VIEWER = 1] = `VIEWER`, e[e.COMMENTER = 2] = `COMMENTER`, e[e.EDITOR = 3] = `EDITOR`, e
    }({}),
    Rr = function(e) {
        return e[e.UNSPECIFIED = 0] = `UNSPECIFIED`, e[e.NEEDS_REVIEW = 1] = `NEEDS_REVIEW`, e[e.APPROVED = 2] = `APPROVED`, e[e.CHANGES_REQUESTED = 3] = `CHANGES_REQUESTED`, e
    }({}),
    zr = function(e) {
        return e[e.UNSPECIFIED = 0] = `UNSPECIFIED`, e[e.BUG = 1] = `BUG`, e[e.FEEDBACK = 2] = `FEEDBACK`, e
    }({}),
    Br = br(Pr, 0),
    R;
(function(e) {
    e[e.Canceled = 1] = `Canceled`, e[e.Unknown = 2] = `Unknown`, e[e.InvalidArgument = 3] = `InvalidArgument`, e[e.DeadlineExceeded = 4] = `DeadlineExceeded`, e[e.NotFound = 5] = `NotFound`, e[e.AlreadyExists = 6] = `AlreadyExists`, e[e.PermissionDenied = 7] = `PermissionDenied`, e[e.ResourceExhausted = 8] = `ResourceExhausted`, e[e.FailedPrecondition = 9] = `FailedPrecondition`, e[e.Aborted = 10] = `Aborted`, e[e.OutOfRange = 11] = `OutOfRange`, e[e.Unimplemented = 12] = `Unimplemented`, e[e.Internal = 13] = `Internal`, e[e.Unavailable = 14] = `Unavailable`, e[e.DataLoss = 15] = `DataLoss`, e[e.Unauthenticated = 16] = `Unauthenticated`
})(R || = {});

function Vr(e, t) {
    Gr(t, e);
    let n = Ur(e.$unknown, t),
        [r, i, a] = Wr(t);
    for (let e of n) gr(r, new Ft(e.data), i, e.wireType, {
        readUnknownFields: !0
    });
    return a()
}

function Hr(e, t, n) {
    Gr(t, e);
    let r = (e.$unknown ? ? []).filter(e => e.no !== t.number),
        [i, a] = Wr(t, n),
        o = new Pt;
    Ln(o, {
        writeUnknownFields: !0
    }, i, a);
    let s = new Ft(o.finish());
    for (; s.pos < s.len;) {
        let [e, t] = s.tag(), n = s.skip(t, e);
        r.push({
            no: e,
            wireType: t,
            data: n
        })
    }
    e.$unknown = r
}

function Ur(e, t) {
    if (e === void 0) return [];
    if (t.fieldKind === `enum` || t.fieldKind === `scalar`) {
        for (let n = e.length - 1; n >= 0; --n)
            if (e[n].no == t.number) return [e[n]];
        return []
    }
    return e.filter(e => e.no === t.number)
}

function Wr(e, t) {
    let n = e.typeName,
        r = Object.assign(Object.assign({}, e), {
            kind: `field`,
            parent: e.extendee,
            localName: n
        }),
        i = Object.assign(Object.assign({}, e.extendee), {
            fields: [r],
            members: [r],
            oneofs: []
        }),
        a = M(i, t === void 0 ? void 0 : {
            [n]: t
        });
    return [N(i, a), r, () => {
        let t = a[n];
        if (t === void 0) {
            let t = e.message;
            return j(t) ? b(t.fields[0].scalar, t.fields[0].longAsString) : M(t)
        }
        return t
    }]
}

function Gr(e, t) {
    if (e.extendee.typeName != t.$typeName) throw Error(`extension ${e.typeName} can only be applied to message ${e.extendee.typeName}`)
}
var Kr = 3,
    qr = 2,
    Jr = {
        alwaysEmitImplicit: !1,
        enumAsInteger: !1,
        useProtoFieldName: !1
    };

function Yr(e) {
    return e ? Object.assign(Object.assign({}, Jr), e) : Jr
}

function Xr(e, t, n) {
    return Qr(N(e, t), Yr(n))
}

function Zr(e, t, n) {
    let r = Xr(e, t, n);
    return JSON.stringify(r, null, n ? .prettySpaces ? ? 0)
}

function Qr(e, t) {
    let n = ai(e, t);
    if (n !== void 0) return n;
    let r = {};
    for (let n of e.sortedFields) {
        if (!e.isSet(n)) {
            if (n.presence == Kr) throw Error(`cannot encode ${n} to JSON: required field not set`);
            if (!t.alwaysEmitImplicit || n.presence !== qr) continue
        }
        let i = $r(n, e.get(n), t);
        i !== void 0 && (r[ii(n, t)] = i)
    }
    if (t.registry) {
        let n = new Set;
        for (let {
                no: i
            } of e.getUnknown() ? ? [])
            if (!n.has(i)) {
                n.add(i);
                let a = t.registry.getExtensionFor(e.desc, i);
                if (!a) continue;
                let [o, s] = Wr(a, Vr(e.message, a)), c = $r(s, o.get(s), t);
                c !== void 0 && (r[a.jsonName] = c)
            }
    }
    return r
}

function $r(e, t, n) {
    switch (e.fieldKind) {
        case `scalar`:
            return ri(e, t);
        case `message`:
            return Qr(t, n);
        case `enum`:
            return ni(e.enum, t, n.enumAsInteger);
        case `list`:
            return ti(t, n);
        case `map`:
            return ei(t, n)
    }
}

function ei(e, t) {
    let n = e.field(),
        r = {};
    switch (n.mapKind) {
        case `scalar`:
            for (let [t, i] of e) r[t] = ri(n, i);
            break;
        case `message`:
            for (let [n, i] of e) r[n] = Qr(i, t);
            break;
        case `enum`:
            for (let [i, a] of e) r[i] = ni(n.enum, a, t.enumAsInteger);
            break
    }
    return t.alwaysEmitImplicit || e.size > 0 ? r : void 0
}

function ti(e, t) {
    let n = e.field(),
        r = [];
    switch (n.listKind) {
        case `scalar`:
            for (let t of e) r.push(ri(n, t));
            break;
        case `enum`:
            for (let i of e) r.push(ni(n.enum, i, t.enumAsInteger));
            break;
        case `message`:
            for (let n of e) r.push(Qr(n, t));
            break
    }
    return t.alwaysEmitImplicit || r.length > 0 ? r : void 0
}

function ni(e, t, n) {
    if (typeof t != `number`) throw Error(`cannot encode ${e} to JSON: expected number, got ${A(t)}`);
    return e.typeName == `google.protobuf.NullValue` ? null : n ? t : e.value[t] ? .name ? ? t
}

function ri(e, t) {
    switch (e.scalar) {
        case y.INT32:
        case y.SFIXED32:
        case y.SINT32:
        case y.FIXED32:
        case y.UINT32:
            if (typeof t != `number`) throw Error(`cannot encode ${e} to JSON: ${k(e,t)?.message}`);
            return t;
        case y.FLOAT:
        case y.DOUBLE:
            if (typeof t != `number`) throw Error(`cannot encode ${e} to JSON: ${k(e,t)?.message}`);
            return Number.isNaN(t) ? `NaN` : t === 1 / 0 ? `Infinity` : t === -1 / 0 ? `-Infinity` : t;
        case y.STRING:
            if (typeof t != `string`) throw Error(`cannot encode ${e} to JSON: ${k(e,t)?.message}`);
            return t;
        case y.BOOL:
            if (typeof t != `boolean`) throw Error(`cannot encode ${e} to JSON: ${k(e,t)?.message}`);
            return t;
        case y.UINT64:
        case y.FIXED64:
        case y.INT64:
        case y.SFIXED64:
        case y.SINT64:
            if (typeof t == `bigint` || typeof t == `string` || typeof t == `number` && Number.isInteger(t)) return t.toString();
            throw Error(`cannot encode ${e} to JSON: ${k(e,t)?.message}`);
        case y.BYTES:
            if (t instanceof Uint8Array) return xt(t);
            throw Error(`cannot encode ${e} to JSON: ${k(e,t)?.message}`)
    }
}

function ii(e, t) {
    return t.useProtoFieldName ? e.name : e.jsonName
}

function ai(e, t) {
    if (e.desc.typeName.startsWith(`google.protobuf.`)) switch (e.desc.typeName) {
        case `google.protobuf.Any`:
            return oi(e.message, t);
        case `google.protobuf.Timestamp`:
            return fi(e.message);
        case `google.protobuf.Duration`:
            return si(e.message);
        case `google.protobuf.FieldMask`:
            return ci(e.message);
        case `google.protobuf.Struct`:
            return li(e.message);
        case `google.protobuf.Value`:
            return ui(e.message);
        case `google.protobuf.ListValue`:
            return di(e.message);
        default:
            if (j(e.desc)) {
                let t = e.desc.fields[0];
                return ri(t, e.get(t))
            }
            return
    }
}

function oi(e, t) {
    if (e.typeUrl === ``) return {};
    let {
        registry: n
    } = t, r, i;
    if (n && (r = Er(e, n), r && (i = n.getMessage(r.$typeName))), !i || !r) throw Error(`cannot encode message ${e.$typeName} to JSON: "${e.typeUrl}" is not in the type registry`);
    let a = N(i, r),
        o = Yt(i) ? {
            value: ai(a, t)
        } : Qr(a, t);
    return o[`@type`] = e.typeUrl, o
}

function si(e) {
    let t = Number(e.seconds),
        n = e.nanos;
    if (t > 315576e6 || t < -315576e6) throw Error(`cannot encode message ${e.$typeName} to JSON: value out of range`);
    if (t > 0 && n < 0 || t < 0 && n > 0) throw Error(`cannot encode message ${e.$typeName} to JSON: nanos sign must match seconds sign`);
    let r = e.seconds.toString();
    if (n !== 0) {
        let e = Math.abs(n).toString();
        e = `0`.repeat(9 - e.length) + e, e.substring(3) === `000000` ? e = e.substring(0, 3) : e.substring(6) === `000` && (e = e.substring(0, 6)), r += `.` + e, n < 0 && t == 0 && (r = `-` + r)
    }
    return r + `s`
}

function ci(e) {
    return e.paths.map(t => {
        if (d(u(t)) !== t) throw Error(`cannot encode message ${e.$typeName} to JSON: lowerCamelCase of path name "${t}" is irreversible`);
        return u(t)
    }).join(`,`)
}

function li(e) {
    let t = {};
    for (let [n, r] of Object.entries(e.fields)) t[n] = ui(r);
    return t
}

function ui(e) {
    switch (e.kind.case) {
        case `nullValue`:
            return null;
        case `numberValue`:
            if (!Number.isFinite(e.kind.value)) throw Error(`${e.$typeName} cannot be NaN or Infinity`);
            return e.kind.value;
        case `boolValue`:
            return e.kind.value;
        case `stringValue`:
            return e.kind.value;
        case `structValue`:
            return li(e.kind.value);
        case `listValue`:
            return di(e.kind.value);
        default:
            throw Error(`${e.$typeName} must have a value`)
    }
}

function di(e) {
    return e.values.map(ui)
}

function fi(e) {
    let t = Number(e.seconds) * 1e3;
    if (t < Date.parse(`0001-01-01T00:00:00Z`) || t > Date.parse(`9999-12-31T23:59:59Z`)) throw Error(`cannot encode message ${e.$typeName} to JSON: must be from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59Z inclusive`);
    if (e.nanos < 0) throw Error(`cannot encode message ${e.$typeName} to JSON: nanos must not be negative`);
    if (e.nanos > 999999999) throw Error(`cannot encode message ${e.$typeName} to JSON: nanos must not be greater than 99999999`);
    let n = `Z`;
    if (e.nanos > 0) {
        let t = (e.nanos + 1e9).toString().substring(1);
        n = t.substring(3) === `000000` ? `.` + t.substring(0, 3) + `Z` : t.substring(6) === `000` ? `.` + t.substring(0, 6) + `Z` : `.` + t + `Z`
    }
    return new Date(t).toISOString().replace(`.000Z`, n)
}
var pi = {
    ignoreUnknownFields: !1
};

function mi(e) {
    return e ? Object.assign(Object.assign({}, pi), e) : pi
}

function hi(e, t, n) {
    return gi(e, Ni(t, e.typeName), n)
}

function gi(e, t, n) {
    let r = N(e);
    try {
        yi(r, t, mi(n))
    } catch (e) {
        throw Ot(e) ? Error(`cannot decode ${e.field()} from JSON: ${e.message}`, {
            cause: e
        }) : e
    }
    return r.message
}
var _i = new WeakMap;

function vi(e, t) {
    if (!_i.has(e)) {
        let t = new Map;
        for (let n of e.fields) t.set(n.name, n).set(n.jsonName, n);
        _i.set(e, t)
    }
    return _i.get(e) ? .get(t)
}

function yi(e, t, n) {
    if (Pi(e, t, n)) return;
    if (t == null || Array.isArray(t) || typeof t != `object`) throw Error(`cannot decode ${e.desc} from JSON: ${A(t)}`);
    let r = new Map;
    for (let [i, a] of Object.entries(t)) {
        let t = vi(e.desc, i);
        if (t) {
            if (t.oneof) {
                if (a === null && t.fieldKind == `scalar`) continue;
                let e = r.get(t.oneof);
                if (e !== void 0) throw new E(t.oneof, `oneof set multiple times by ${e.name} and ${t.name}`);
                r.set(t.oneof, t)
            }
            bi(e, t, a, n)
        } else {
            let t;
            if (i.startsWith(`[`) && i.endsWith(`]`) && (t = n.registry ? .getExtension(i.substring(1, i.length - 1))) && t.extendee.typeName === e.desc.typeName) {
                let [r, i, o] = Wr(t);
                bi(r, i, a, n), Hr(e.message, t, o())
            }
            if (!t && !n.ignoreUnknownFields) throw Error(`cannot decode ${e.desc} from JSON: key "${i}" is unknown`)
        }
    }
}

function bi(e, t, n, r) {
    switch (t.fieldKind) {
        case `scalar`:
            Ei(e, t, n);
            break;
        case `enum`:
            Ti(e, t, n, r);
            break;
        case `message`:
            wi(e, t, n, r);
            break;
        case `list`:
            Ci(e.get(t), n, r);
            break;
        case `map`:
            Si(e.get(t), n, r);
            break
    }
}

function xi(e, t, n) {
    if (e.scalar && t !== null) return Ai(e, t);
    if (e.message && !Di(e, t)) {
        let r = N(e.message);
        return yi(r, t, n), r
    }
    if (e.enum && !Di(e, t)) return ki(e.enum, t, n.ignoreUnknownFields);
    throw new E(e, `${e.fieldKind===`list`?`list item`:`map value`} must not be null`)
}

function Si(e, t, n) {
    if (t === null) return;
    let r = e.field();
    if (typeof t != `object` || Array.isArray(t)) throw new E(r, `expected object, got ` + A(t));
    for (let [i, a] of Object.entries(t)) {
        let t = ji(r.mapKey, i),
            o = xi(r, a, n);
        o !== Oi && e.set(t, o)
    }
}

function Ci(e, t, n) {
    if (t === null) return;
    let r = e.field();
    if (!Array.isArray(t)) throw new E(r, `expected Array, got ` + A(t));
    for (let i of t) {
        let t = xi(r, i, n);
        t !== Oi && e.add(t)
    }
}

function wi(e, t, n, r) {
    if (Di(t, n)) {
        e.clear(t);
        return
    }
    let i = e.isSet(t) ? e.get(t) : N(t.message);
    yi(i, n, r), e.set(t, i)
}

function Ti(e, t, n, r) {
    if (Di(t, n)) {
        e.clear(t);
        return
    }
    let i = ki(t.enum, n, r.ignoreUnknownFields);
    i !== Oi && e.set(t, i)
}

function Ei(e, t, n) {
    n === null ? e.clear(t) : e.set(t, Ai(t, n))
}

function Di(e, t) {
    return t === null && e.message ? .typeName != `google.protobuf.Value` && e.enum ? .typeName != `google.protobuf.NullValue`
}
var Oi = Symbol();

function ki(e, t, n) {
    if (t === null) return e.values[0].number;
    switch (typeof t) {
        case `number`:
            if (Number.isInteger(t)) return t;
            break;
        case `string`:
            let r = e.values.find(e => e.name === t);
            if (r !== void 0) return r.number;
            if (n) return Oi;
            break
    }
    throw Error(`cannot decode ${e} from JSON: ${A(t)}`)
}

function Ai(e, t) {
    switch (e.scalar) {
        case y.DOUBLE:
        case y.FLOAT:
            if (t === `NaN`) return NaN;
            if (t === `Infinity`) return 1 / 0;
            if (t === `-Infinity`) return -1 / 0;
            if (typeof t == `number`) {
                if (Number.isNaN(t)) throw new E(e, `unexpected NaN number`);
                if (!Number.isFinite(t)) throw new E(e, `unexpected infinite number`);
                break
            }
            if (typeof t == `string`) {
                if (t === `` || t.trim().length !== t.length) break;
                let e = Number(t);
                if (!Number.isFinite(e)) break;
                return e
            }
            break;
        case y.INT32:
        case y.FIXED32:
        case y.SFIXED32:
        case y.SINT32:
        case y.UINT32:
            return Mi(t);
        case y.BYTES:
            if (typeof t == `string`) {
                if (t === ``) return new Uint8Array;
                try {
                    return bt(t)
                } catch (t) {
                    throw new E(e, t instanceof Error ? t.message : String(t))
                }
            }
            break
    }
    return t
}

function ji(e, t) {
    switch (e) {
        case y.BOOL:
            switch (t) {
                case `true`:
                    return !0;
                case `false`:
                    return !1
            }
            return t;
        case y.INT32:
        case y.FIXED32:
        case y.UINT32:
        case y.SFIXED32:
        case y.SINT32:
            return Mi(t);
        default:
            return t
    }
}

function Mi(e) {
    if (typeof e == `string`) {
        if (e === `` || e.trim().length !== e.length) return e;
        let t = Number(e);
        return Number.isNaN(t) ? e : t
    }
    return e
}

function Ni(e, t) {
    try {
        return JSON.parse(e)
    } catch (e) {
        let n = e instanceof Error ? e.message : String(e);
        throw Error(`cannot decode message ${t} from JSON: ${n}`, {
            cause: e
        })
    }
}

function Pi(e, t, n) {
    if (!e.desc.typeName.startsWith(`google.protobuf.`)) return !1;
    switch (e.desc.typeName) {
        case `google.protobuf.Any`:
            return Fi(e.message, t, n), !0;
        case `google.protobuf.Timestamp`:
            return Ii(e.message, t), !0;
        case `google.protobuf.Duration`:
            return Li(e.message, t), !0;
        case `google.protobuf.FieldMask`:
            return Ri(e.message, t), !0;
        case `google.protobuf.Struct`:
            return zi(e.message, t), !0;
        case `google.protobuf.Value`:
            return Bi(e.message, t), !0;
        case `google.protobuf.ListValue`:
            return Vi(e.message, t), !0;
        default:
            if (j(e.desc)) {
                let n = e.desc.fields[0];
                return t === null ? e.clear(n) : e.set(n, Ai(n, t)), !0
            }
            return !1
    }
}

function Fi(e, t, n) {
    if (t === null || Array.isArray(t) || typeof t != `object`) throw Error(`cannot decode message ${e.$typeName} from JSON: expected object but got ${A(t)}`);
    if (Object.keys(t).length == 0) return;
    let r = t[`@type`];
    if (typeof r != `string` || r == ``) throw Error(`cannot decode message ${e.$typeName} from JSON: "@type" is empty`);
    let i = r.includes(`/`) ? r.substring(r.lastIndexOf(`/`) + 1) : r;
    if (!i.length) throw Error(`cannot decode message ${e.$typeName} from JSON: "@type" is invalid`);
    let a = n.registry ? .getMessage(i);
    if (!a) throw Error(`cannot decode message ${e.$typeName} from JSON: ${r} is not in the type registry`);
    let o = N(a);
    if (Yt(a) && Object.prototype.hasOwnProperty.call(t, `value`)) {
        let e = t.value;
        yi(o, e, n)
    } else {
        let e = Object.assign({}, t);
        delete e[`@type`], yi(o, e, n)
    }
    wr(o.desc, o.message, e)
}

function Ii(e, t) {
    if (typeof t != `string`) throw Error(`cannot decode message ${e.$typeName} from JSON: ${A(t)}`);
    let n = t.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]{1,9}))?(?:Z|([+-][0-9][0-9]:[0-9][0-9]))$/);
    if (!n) throw Error(`cannot decode message ${e.$typeName} from JSON: invalid RFC 3339 string`);
    let r = Date.parse(n[1] + `-` + n[2] + `-` + n[3] + `T` + n[4] + `:` + n[5] + `:` + n[6] + (n[8] ? n[8] : `Z`));
    if (Number.isNaN(r)) throw Error(`cannot decode message ${e.$typeName} from JSON: invalid RFC 3339 string`);
    if (r < Date.parse(`0001-01-01T00:00:00Z`) || r > Date.parse(`9999-12-31T23:59:59Z`)) throw Error(`cannot decode message ${e.$typeName} from JSON: must be from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59Z inclusive`);
    e.seconds = v.parse(r / 1e3), e.nanos = 0, n[7] && (e.nanos = parseInt(`1` + n[7] + `0`.repeat(9 - n[7].length)) - 1e9)
}

function Li(e, t) {
    if (typeof t != `string`) throw Error(`cannot decode message ${e.$typeName} from JSON: ${A(t)}`);
    let n = t.match(/^(-?[0-9]+)(?:\.([0-9]+))?s/);
    if (n === null) throw Error(`cannot decode message ${e.$typeName} from JSON: ${A(t)}`);
    let r = Number(n[1]);
    if (r > 315576e6 || r < -315576e6) throw Error(`cannot decode message ${e.$typeName} from JSON: ${A(t)}`);
    if (e.seconds = v.parse(r), typeof n[2] != `string`) return;
    let i = n[2] + `0`.repeat(9 - n[2].length);
    e.nanos = parseInt(i), (r < 0 || Object.is(r, -0)) && (e.nanos = -e.nanos)
}

function Ri(e, t) {
    if (typeof t != `string`) throw Error(`cannot decode message ${e.$typeName} from JSON: ${A(t)}`);
    t !== `` && (e.paths = t.split(`,`).map(t => {
        if (t.includes(`_`)) throw Error(`cannot decode message ${e.$typeName} from JSON: path names must be lowerCamelCase`);
        return d(t)
    }))
}

function zi(e, t) {
    if (typeof t != `object` || !t || Array.isArray(t)) throw Error(`cannot decode message ${e.$typeName} from JSON ${A(t)}`);
    for (let [n, r] of Object.entries(t)) {
        let t = M(jr);
        Bi(t, r), e.fields[n] = t
    }
}

function Bi(e, t) {
    switch (typeof t) {
        case `number`:
            e.kind = {
                case: `numberValue`,
                value: t
            };
            break;
        case `string`:
            e.kind = {
                case: `stringValue`,
                value: t
            };
            break;
        case `boolean`:
            e.kind = {
                case: `boolValue`,
                value: t
            };
            break;
        case `object`:
            if (t === null) e.kind = {
                case: `nullValue`,
                value: Nr.NULL_VALUE
            };
            else if (Array.isArray(t)) {
                let n = M(Mr);
                Vi(n, t), e.kind = {
                    case: `listValue`,
                    value: n
                }
            } else {
                let n = M(Ar);
                zi(n, t), e.kind = {
                    case: `structValue`,
                    value: n
                }
            }
            break;
        default:
            throw Error(`cannot decode message ${e.$typeName} from JSON ${A(t)}`)
    }
    return e
}

function Vi(e, t) {
    if (!Array.isArray(t)) throw Error(`cannot decode message ${e.$typeName} from JSON ${A(t)}`);
    for (let n of t) {
        let t = M(jr);
        Bi(t, n), e.values.push(t)
    }
}

function Hi(e) {
    let t = R[e];
    return typeof t == `string` ? t[0].toLowerCase() + t.substring(1).replace(/[A-Z]/g, e => `_` + e.toLowerCase()) : e.toString()
}
var Ui;

function Wi(e) {
    if (!Ui) {
        Ui = {};
        for (let e of Object.values(R)) typeof e != `string` && (Ui[Hi(e)] = e)
    }
    return Ui[e]
}
var z = class e extends Error {
    constructor(e, t = R.Unknown, n, r, i) {
        super(Gi(e, t)), this.name = `ConnectError`, Object.setPrototypeOf(this, new.target.prototype), this.rawMessage = e, this.code = t, this.metadata = new Headers(n ? ? {}), this.details = r ? ? [], this.cause = i
    }
    static from(t, n = R.Unknown) {
        return t instanceof e ? t : t instanceof Error ? t.name == `AbortError` || t.name == `TimeoutError` ? new e(t.message, R.Canceled) : new e(t.message, n, void 0, void 0, t) : new e(String(t), n, void 0, void 0, t)
    }
    static[Symbol.hasInstance](t) {
        return t instanceof Error ? Object.getPrototypeOf(t) === e.prototype ? !0 : t.name === `ConnectError` && `code` in t && typeof t.code == `number` && `metadata` in t && `details` in t && Array.isArray(t.details) && `rawMessage` in t && typeof t.rawMessage == `string` && `cause` in t : !1
    }
    findDetails(e) {
        let t = e.kind === `message` ? {
                getMessage: t => t === e.typeName ? e : void 0
            } : e,
            n = [];
        for (let e of this.details) {
            if (`desc` in e) {
                t.getMessage(e.desc.typeName) && n.push(M(e.desc, e.value));
                continue
            }
            let r = t.getMessage(e.type);
            if (r) try {
                n.push(mr(r, e.value))
            } catch {}
        }
        return n
    }
};

function Gi(e, t) {
    return e.length ? `[${Hi(t)}] ${e}` : `[${Hi(t)}]`
}

function Ki(e, t) {
    let n;
    return n = t === void 0 ? typeof e == `string` ? new TextEncoder().encode(e) : e instanceof Uint8Array ? e : new Uint8Array(e) : Fn(t, e), xt(n, `std_raw`)
}

function qi(e, t, n) {
    try {
        let r = bt(e);
        return t ? mr(t, r, n) : r
    } catch (e) {
        throw z.from(e, R.DataLoss)
    }
}

function Ji(...e) {
    let t = new Headers;
    for (let n of e) n.forEach((e, n) => {
        t.append(n, e)
    });
    return t
}

function Yi(e, t) {
    let n = {};
    for (let r of e.methods) {
        let e = t(r);
        e != null && (n[r.localName] = e)
    }
    return n
}

function Xi(e, t, n, r) {
    let i = null,
        a = null,
        o;
    if (t !== null && t !== `identity`) {
        let n = e.find(e => e.name === t);
        if (n) i = n;
        else {
            let n = e.map(e => e.name).join(`,`);
            o = new z(`unknown compression "${t}": supported encodings are ${n}`, R.Unimplemented, {
                [r]: n
            })
        }
    }
    if (n === null || n === ``) a = i;
    else {
        let t = n.split(`,`).map(e => e.trim());
        for (let n of t) {
            let t = e.find(e => e.name === n);
            if (t) {
                a = t;
                break
            }
        }
    }
    return {
        request: i,
        response: a,
        error: o
    }
}
var Zi = 4294967295,
    Qi = Zi,
    $i = 1024;

function ea(e, t, n) {
    if (t ? ? = Qi, e ? ? = Zi, n ? ? = $i, t < 1 || t > Qi) throw new z(`writeMaxBytes ${t} must be >= 1 and <= ${Qi}`, R.Internal);
    if (e < 1 || e > Zi) throw new z(`readMaxBytes ${e} must be >= 1 and <= ${Zi}`, R.Internal);
    return {
        readMaxBytes: e,
        writeMaxBytes: t,
        compressMinBytes: n
    }
}

function ta(e, t) {
    if (t > e) throw new z(`message size ${t} is larger than configured writeMaxBytes ${e}`, R.ResourceExhausted)
}

function na(e, t, n = !1) {
    if (t > e) {
        let r = `message size is larger than configured readMaxBytes ${e}`;
        throw n && (r = `message size ${t} is larger than configured readMaxBytes ${e}`), new z(r, R.ResourceExhausted)
    }
}

function ra(e) {
    return new ia(e)
}
var ia = class {
    constructor(e) {
        this.readMaxBytes = e, this.header = new Uint8Array(5), this.headerView = new DataView(this.header.buffer), this.buf = []
    }
    get byteLength() {
        return this.buf.reduce((e, t) => e + t.byteLength, 0)
    }
    decode(e) {
        this.buf.push(e);
        let t = [];
        for (;;) {
            let e = this.pop();
            if (!e) break;
            t.push(e)
        }
        return t
    }
    pop() {
        if (!(!this.env && (this.env = this.head(), !this.env)) && this.cons(this.env.data)) {
            let e = this.env;
            return this.env = void 0, e
        }
    }
    head() {
        if (!this.cons(this.header)) return;
        let e = this.headerView.getUint8(0),
            t = this.headerView.getUint32(1);
        return na(this.readMaxBytes, t, !0), {
            flags: e,
            data: new Uint8Array(t)
        }
    }
    cons(e) {
        let t = e.byteLength;
        if (this.byteLength < t) return !1;
        let n = 0;
        for (; n < t;) {
            let r = this.buf.shift();
            r.byteLength > t - n ? (e.set(r.subarray(0, t - n), n), this.buf.unshift(r.subarray(t - n)), n += t - n) : (e.set(r, n), n += r.byteLength)
        }
        return !0
    }
};

function aa(e) {
    let t, n = ra(4294967295);
    return new ReadableStream({
        start() {
            t = e.getReader()
        },
        async pull(e) {
            let r = !1;
            for (; !r;) {
                let i = await t.read();
                if (i.done) n.byteLength > 0 && e.error(new z(`protocol error: incomplete envelope`, R.InvalidArgument)), e.close();
                else
                    for (let t of n.decode(i.value)) e.enqueue(t), r = !0
            }
        }
    })
}
async function oa(e, t, n) {
    let {
        flags: r,
        data: i
    } = e;
    if ((r & 1) == 1) throw new z(`invalid envelope, already compressed`, R.Internal);
    return t && i.byteLength >= n && (i = await t.compress(i), r |= 1), {
        data: i,
        flags: r
    }
}
async function sa(e, t, n) {
    let {
        flags: r,
        data: i
    } = e;
    if ((r & 1) == 1) {
        if (!t) throw new z(`received compressed envelope, but do not know how to decompress`, R.Internal);
        i = await t.decompress(i, n), r ^= 1
    }
    return {
        data: i,
        flags: r
    }
}

function ca(e, t) {
    let n = new Uint8Array(t.length + 5);
    n.set(t, 5);
    let r = new DataView(n.buffer, n.byteOffset, n.byteLength);
    return r.setUint8(0, e), r.setUint32(1, t.length), n
}
var B = function(e) {
        if (!Symbol.asyncIterator) throw TypeError(`Symbol.asyncIterator is not defined.`);
        var t = e[Symbol.asyncIterator],
            n;
        return t ? t.call(e) : (e = typeof __values == `function` ? __values(e) : e[Symbol.iterator](), n = {}, r(`next`), r(`throw`), r(`return`), n[Symbol.asyncIterator] = function() {
            return this
        }, n);

        function r(t) {
            n[t] = e[t] && function(n) {
                return new Promise(function(r, a) {
                    n = e[t](n), i(r, a, n.done, n.value)
                })
            }
        }

        function i(e, t, n, r) {
            Promise.resolve(r).then(function(t) {
                e({
                    value: t,
                    done: n
                })
            }, t)
        }
    },
    V = function(e) {
        return this instanceof V ? (this.v = e, this) : new V(e)
    },
    H = function(e, t, n) {
        if (!Symbol.asyncIterator) throw TypeError(`Symbol.asyncIterator is not defined.`);
        var r = n.apply(e, t || []),
            i, a = [];
        return i = Object.create((typeof AsyncIterator == `function` ? AsyncIterator : Object).prototype), s(`next`), s(`throw`), s(`return`, o), i[Symbol.asyncIterator] = function() {
            return this
        }, i;

        function o(e) {
            return function(t) {
                return Promise.resolve(t).then(e, d)
            }
        }

        function s(e, t) {
            r[e] && (i[e] = function(t) {
                return new Promise(function(n, r) {
                    a.push([e, t, n, r]) > 1 || c(e, t)
                })
            }, t && (i[e] = t(i[e])))
        }

        function c(e, t) {
            try {
                l(r[e](t))
            } catch (e) {
                f(a[0][3], e)
            }
        }

        function l(e) {
            e.value instanceof V ? Promise.resolve(e.value.v).then(u, d) : f(a[0][2], e)
        }

        function u(e) {
            c(`next`, e)
        }

        function d(e) {
            c(`throw`, e)
        }

        function f(e, t) {
            e(t), a.shift(), a.length && c(a[0][0], a[0][1])
        }
    },
    la = function(e) {
        var t, n;
        return t = {}, r(`next`), r(`throw`, function(e) {
            throw e
        }), r(`return`), t[Symbol.iterator] = function() {
            return this
        }, t;

        function r(r, i) {
            t[r] = e[r] ? function(t) {
                return (n = !n) ? {
                    value: V(e[r](t)),
                    done: !1
                } : i ? i(t) : t
            } : i
        }
    };

function ua(e, ...t) {
    let [n, r, i] = da(t), a = e, o;
    return i ? .propagateDownStreamError === !0 && (a = o = Ta(a)), a = U(a, ...n, {
        propagateDownStreamError: !1
    }), r(a).catch(e => o ? o.abort(e).then(() => Promise.reject(e)) : Promise.reject(e))
}

function da(e) {
    let t;
    return typeof e[e.length - 1] != `function` && (t = e.pop()), [e, e.pop(), t]
}

function fa(e, t) {
    return async n => await Sa(n, e, t)
}

function U(e, ...t) {
    return H(this, arguments, function*() {
        var n;
        let [r, i] = pa(t), a, o = e[Symbol.asyncIterator](), s = {
            [Symbol.asyncIterator]() {
                return o
            }
        };
        i ? .propagateDownStreamError === !0 && (s = a = Ta(s));
        for (let e of r) s = e(s);
        let c = s[Symbol.asyncIterator]();
        try {
            for (;;) {
                let e = yield V(c.next());
                if (e.done === !0) break;
                if (!a) {
                    yield yield V(e.value);
                    continue
                }
                try {
                    yield yield V(e.value)
                } catch (e) {
                    throw yield V(a.abort(e)), e
                }
            }
        } finally {
            i ? .propagateDownStreamError === !0 && ((n = o.return) == null || n.call(o).catch(() => {}))
        }
    })
}

function pa(e) {
    let t;
    return typeof e[e.length - 1] != `function` && (t = e.pop()), [e, t]
}

function ma(e) {
    return function(t) {
        return H(this, arguments, function*() {
            let n, r = t[Symbol.asyncIterator]();
            for (;;) {
                let e;
                try {
                    e = yield V(r.next())
                } catch (e) {
                    n = e;
                    break
                }
                if (e.done === !0) break;
                yield yield V(e.value)
            }
            let i = yield V(e(n));
            i !== void 0 && (yield yield V(i))
        })
    }
}

function ha(e) {
    return function(t) {
        return H(this, arguments, function*() {
            var n, r, i, a;
            let o = yield V(e());
            o !== void 0 && (yield yield V(o));
            try {
                for (var s = !0, c = B(t), l; l = yield V(c.next()), n = l.done, !n; s = !0) a = l.value, s = !1, yield yield V(a)
            } catch (e) {
                r = {
                    error: e
                }
            } finally {
                try {
                    !s && !n && (i = c.return) && (yield V(i.call(c)))
                } finally {
                    if (r) throw r.error
                }
            }
        })
    }
}

function ga(e, t, n) {
    return t === void 0 || n === void 0 ? function(t) {
        return H(this, arguments, function*() {
            var n, r, i, a;
            try {
                for (var o = !0, s = B(t), c; c = yield V(s.next()), n = c.done, !n; o = !0) {
                    a = c.value, o = !1;
                    let t = a;
                    yield yield V({
                        flags: 0,
                        data: e.serialize(t)
                    })
                }
            } catch (e) {
                r = {
                    error: e
                }
            } finally {
                try {
                    !o && !n && (i = s.return) && (yield V(i.call(s)))
                } finally {
                    if (r) throw r.error
                }
            }
        })
    } : function(r) {
        return H(this, arguments, function*() {
            var i, a, o, s;
            try {
                for (var c = !0, l = B(r), u; u = yield V(l.next()), i = u.done, !i; c = !0) {
                    s = u.value, c = !1;
                    let r = s,
                        i, a = 0;
                    r.end ? (a |= t, i = n.serialize(r.value)) : i = e.serialize(r.value), yield yield V({
                        flags: a,
                        data: i
                    })
                }
            } catch (e) {
                a = {
                    error: e
                }
            } finally {
                try {
                    !c && !i && (o = l.return) && (yield V(o.call(l)))
                } finally {
                    if (a) throw a.error
                }
            }
        })
    }
}

function _a(e, t, n) {
    return n && t !== void 0 ? function(r) {
        return H(this, arguments, function*() {
            var i, a, o, s;
            try {
                for (var c = !0, l = B(r), u; u = yield V(l.next()), i = u.done, !i; c = !0) {
                    s = u.value, c = !1;
                    let {
                        flags: r,
                        data: i
                    } = s;
                    (r & t) === t ? yield yield V({
                        value: n.parse(i),
                        end: !0
                    }): yield yield V({
                        value: e.parse(i),
                        end: !1
                    })
                }
            } catch (e) {
                a = {
                    error: e
                }
            } finally {
                try {
                    !c && !i && (o = l.return) && (yield V(o.call(l)))
                } finally {
                    if (a) throw a.error
                }
            }
        })
    } : function(r) {
        return H(this, arguments, function*() {
            var i, a, o, s;
            try {
                for (var c = !0, l = B(r), u; u = yield V(l.next()), i = u.done, !i; c = !0) {
                    s = u.value, c = !1;
                    let {
                        flags: r,
                        data: i
                    } = s;
                    if (t !== void 0 && (r & t) === t) {
                        if (n === null) throw new z(`unexpected end flag`, R.InvalidArgument);
                        continue
                    }
                    yield yield V(e.parse(i))
                }
            } catch (e) {
                a = {
                    error: e
                }
            } finally {
                try {
                    !c && !i && (o = l.return) && (yield V(o.call(l)))
                } finally {
                    if (a) throw a.error
                }
            }
        })
    }
}

function va(e, t) {
    return function(n) {
        return H(this, arguments, function*() {
            var r, i, a, o;
            try {
                for (var s = !0, c = B(n), l; l = yield V(c.next()), r = l.done, !r; s = !0) o = l.value, s = !1, yield yield V(yield V(oa(o, e, t)))
            } catch (e) {
                i = {
                    error: e
                }
            } finally {
                try {
                    !s && !r && (a = c.return) && (yield V(a.call(c)))
                } finally {
                    if (i) throw i.error
                }
            }
        })
    }
}

function ya(e, t) {
    return function(n) {
        return H(this, arguments, function*() {
            var r, i, a, o;
            try {
                for (var s = !0, c = B(n), l; l = yield V(c.next()), r = l.done, !r; s = !0) o = l.value, s = !1, yield yield V(yield V(sa(o, e, t)))
            } catch (e) {
                i = {
                    error: e
                }
            } finally {
                try {
                    !s && !r && (a = c.return) && (yield V(a.call(c)))
                } finally {
                    if (i) throw i.error
                }
            }
        })
    }
}

function ba() {
    return function(e) {
        return H(this, arguments, function*() {
            var t, n, r, i;
            try {
                for (var a = !0, o = B(e), s; s = yield V(o.next()), t = s.done, !t; a = !0) {
                    i = s.value, a = !1;
                    let {
                        flags: e,
                        data: t
                    } = i;
                    yield yield V(ca(e, t))
                }
            } catch (e) {
                n = {
                    error: e
                }
            } finally {
                try {
                    !a && !t && (r = o.return) && (yield V(r.call(o)))
                } finally {
                    if (n) throw n.error
                }
            }
        })
    }
}

function xa(e) {
    return function(t) {
        return H(this, arguments, function*() {
            var n, r, i, a;
            let o = ra(e);
            try {
                for (var s = !0, c = B(t), l; l = yield V(c.next()), n = l.done, !n; s = !0) {
                    a = l.value, s = !1;
                    let e = a;
                    for (let t of o.decode(e)) yield yield V(t)
                }
            } catch (e) {
                r = {
                    error: e
                }
            } finally {
                try {
                    !s && !n && (i = c.return) && (yield V(i.call(c)))
                } finally {
                    if (r) throw r.error
                }
            }
            if (o.byteLength > 0) throw new z(`protocol error: incomplete envelope`, R.InvalidArgument)
        })
    }
}
async function Sa(e, t, n) {
    var r, i, a, o, s, c, l, u;
    let [d, f] = Ca(n);
    if (d) {
        f > t && na(t, f, !0);
        let n = new Uint8Array(f),
            s = 0;
        try {
            for (var p = !0, m = B(e), h; h = await m.next(), r = h.done, !r; p = !0) {
                o = h.value, p = !1;
                let e = o;
                if (s + e.byteLength > f) throw new z(`protocol error: promised ${f} bytes, received ${s+e.byteLength}`, R.InvalidArgument);
                n.set(e, s), s += e.byteLength
            }
        } catch (e) {
            i = {
                error: e
            }
        } finally {
            try {
                !p && !r && (a = m.return) && await a.call(m)
            } finally {
                if (i) throw i.error
            }
        }
        if (s < f) throw new z(`protocol error: promised ${f} bytes, received ${s}`, R.InvalidArgument);
        return n
    }
    let g = [],
        ee = 0;
    try {
        for (var te = !0, _ = B(e), ne; ne = await _.next(), s = ne.done, !s; te = !0) {
            u = ne.value, te = !1;
            let e = u;
            ee += e.byteLength, na(t, ee), g.push(e)
        }
    } catch (e) {
        c = {
            error: e
        }
    } finally {
        try {
            !te && !s && (l = _.return) && await l.call(_)
        } finally {
            if (c) throw c.error
        }
    }
    let re = new Uint8Array(ee),
        ie = 0;
    for (let e = g.shift(); e; e = g.shift()) re.set(e, ie), ie += e.byteLength;
    return re
}

function Ca(e) {
    if (e == null) return [!1, 0];
    let t = typeof e == `string` ? parseInt(e, 10) : e;
    return !Number.isSafeInteger(t) || t < 0 ? [!1, t] : [!0, t]
}
async function wa(e) {
    let t = e[Symbol.asyncIterator](),
        n = await t.next();
    return {
        [Symbol.asyncIterator]() {
            let e = {
                async next() {
                    if (n !== null) {
                        let e = n;
                        return n = null, e
                    }
                    return await t.next()
                }
            };
            return t.throw !== void 0 && (e.throw = e => t.throw(e)), t.return !== void 0 && (e.return = e => t.return(e)), e
        }
    }
}

function Ta(e) {
    let t = e[Symbol.asyncIterator]();
    if (t.throw === void 0) throw Error(`AsyncIterable does not implement throw`);
    let n = t,
        r, i, a = {
            next() {
                return i = n.next().finally(() => {
                    i = void 0
                }), i
            },
            throw (e) {
                return n.throw(e)
            }
        };
    t.return !== void 0 && (a = Object.assign(Object.assign({}, a), {
        return (e) {
            return n.return(e)
        }
    }));
    let o = !1;
    return {
        abort(e) {
            if (r) return r.state;
            let t = () => n.throw(e).then(e => e.done === !0 ? `completed` : `caught`, () => `rethrown`);
            return i ? (r = {
                reason: e,
                state: i.then(t, t)
            }, r.state) : (r = {
                reason: e,
                state: t()
            }, r.state)
        },
        [Symbol.asyncIterator]() {
            if (o) throw Error(`AsyncIterable cannot be re-used`);
            return o = !0, a
        }
    }
}

function W(e) {
    return H(this, arguments, function*() {
        yield V(yield* la(B(e)))
    })
}
var Ea = function(e) {
    if (!Symbol.asyncIterator) throw TypeError(`Symbol.asyncIterator is not defined.`);
    var t = e[Symbol.asyncIterator],
        n;
    return t ? t.call(e) : (e = typeof __values == `function` ? __values(e) : e[Symbol.iterator](), n = {}, r(`next`), r(`throw`), r(`return`), n[Symbol.asyncIterator] = function() {
        return this
    }, n);

    function r(t) {
        n[t] = e[t] && function(n) {
            return new Promise(function(r, a) {
                n = e[t](n), i(r, a, n.done, n.value)
            })
        }
    }

    function i(e, t, n, r) {
        Promise.resolve(r).then(function(t) {
            e({
                value: t,
                done: n
            })
        }, t)
    }
};

function Da(e, t) {
    return Yi(e, e => {
        switch (e.methodKind) {
            case `unary`:
                return Oa(t, e);
            case `server_streaming`:
                return ka(t, e);
            default:
                return null
        }
    })
}

function Oa(e, t) {
    return (n, r, i) => {
        let a = new AbortController;
        return i = Aa(a, i), e.unary(t, a.signal, i.timeoutMs, i.headers, n, i.contextValues).then(e => {
            var t, n;
            (t = i.onHeader) == null || t.call(i, e.header), (n = i.onTrailer) == null || n.call(i, e.trailer), r(void 0, e.message)
        }, e => {
            let n = z.from(e, R.Internal);
            n.code === R.Canceled && a.signal.aborted || r(n, M(t.output))
        }), () => a.abort()
    }
}

function ka(e, t) {
    return (n, r, i, a) => {
        let o = new AbortController;
        async function s() {
            var s, c, l, u, d, f;
            a = Aa(o, a);
            let p = await e.stream(t, a.signal, a.timeoutMs, a.headers, W([n]), a.contextValues);
            (d = a.onHeader) == null || d.call(a, p.header);
            try {
                for (var m = !0, h = Ea(p.message), g; g = await h.next(), s = g.done, !s; m = !0) u = g.value, m = !1, r(u)
            } catch (e) {
                c = {
                    error: e
                }
            } finally {
                try {
                    !m && !s && (l = h.return) && await l.call(h)
                } finally {
                    if (c) throw c.error
                }
            }(f = a.onTrailer) == null || f.call(a, p.trailer), i(void 0)
        }
        return s().catch(e => {
            let t = z.from(e, R.Internal);
            t.code === R.Canceled && o.signal.aborted ? i(void 0) : i(t)
        }), () => o.abort()
    }
}

function Aa(e, t) {
    return t ? .signal && (t.signal.addEventListener(`abort`, () => e.abort()), t.signal.aborted && e.abort()), Object.assign(Object.assign({}, t), {
        signal: e.signal
    })
}
var ja = function(e) {
        if (!Symbol.asyncIterator) throw TypeError(`Symbol.asyncIterator is not defined.`);
        var t = e[Symbol.asyncIterator],
            n;
        return t ? t.call(e) : (e = typeof __values == `function` ? __values(e) : e[Symbol.iterator](), n = {}, r(`next`), r(`throw`), r(`return`), n[Symbol.asyncIterator] = function() {
            return this
        }, n);

        function r(t) {
            n[t] = e[t] && function(n) {
                return new Promise(function(r, a) {
                    n = e[t](n), i(r, a, n.done, n.value)
                })
            }
        }

        function i(e, t, n, r) {
            Promise.resolve(r).then(function(t) {
                e({
                    value: t,
                    done: n
                })
            }, t)
        }
    },
    G = function(e) {
        return this instanceof G ? (this.v = e, this) : new G(e)
    },
    Ma = function(e) {
        var t, n;
        return t = {}, r(`next`), r(`throw`, function(e) {
            throw e
        }), r(`return`), t[Symbol.iterator] = function() {
            return this
        }, t;

        function r(r, i) {
            t[r] = e[r] ? function(t) {
                return (n = !n) ? {
                    value: G(e[r](t)),
                    done: !1
                } : i ? i(t) : t
            } : i
        }
    },
    Na = function(e, t, n) {
        if (!Symbol.asyncIterator) throw TypeError(`Symbol.asyncIterator is not defined.`);
        var r = n.apply(e, t || []),
            i, a = [];
        return i = Object.create((typeof AsyncIterator == `function` ? AsyncIterator : Object).prototype), s(`next`), s(`throw`), s(`return`, o), i[Symbol.asyncIterator] = function() {
            return this
        }, i;

        function o(e) {
            return function(t) {
                return Promise.resolve(t).then(e, d)
            }
        }

        function s(e, t) {
            r[e] && (i[e] = function(t) {
                return new Promise(function(n, r) {
                    a.push([e, t, n, r]) > 1 || c(e, t)
                })
            }, t && (i[e] = t(i[e])))
        }

        function c(e, t) {
            try {
                l(r[e](t))
            } catch (e) {
                f(a[0][3], e)
            }
        }

        function l(e) {
            e.value instanceof G ? Promise.resolve(e.value.v).then(u, d) : f(a[0][2], e)
        }

        function u(e) {
            c(`next`, e)
        }

        function d(e) {
            c(`throw`, e)
        }

        function f(e, t) {
            e(t), a.shift(), a.length && c(a[0][0], a[0][1])
        }
    };

function Pa(e, t) {
    return Yi(e, e => {
        switch (e.methodKind) {
            case `unary`:
                return Fa(t, e);
            case `server_streaming`:
                return Ia(t, e);
            case `client_streaming`:
                return La(t, e);
            case `bidi_streaming`:
                return Ra(t, e);
            default:
                return null
        }
    })
}

function Fa(e, t) {
    return async (n, r) => {
        var i, a;
        let o = await e.unary(t, r ? .signal, r ? .timeoutMs, r ? .headers, n, r ? .contextValues);
        return (i = r ? .onHeader) == null || i.call(r, o.header), (a = r ? .onTrailer) == null || a.call(r, o.trailer), o.message
    }
}

function Ia(e, t) {
    return (n, r) => za(e.stream(t, r ? .signal, r ? .timeoutMs, r ? .headers, W([n]), r ? .contextValues), r)
}

function La(e, t) {
    return async (n, r) => {
        var i, a, o, s, c, l;
        let u = await e.stream(t, r ? .signal, r ? .timeoutMs, r ? .headers, n, r ? .contextValues);
        (c = r ? .onHeader) == null || c.call(r, u.header);
        let d, f = 0;
        try {
            for (var p = !0, m = ja(u.message), h; h = await m.next(), i = h.done, !i; p = !0) s = h.value, p = !1, d = s, f++
        } catch (e) {
            a = {
                error: e
            }
        } finally {
            try {
                !p && !i && (o = m.return) && await o.call(m)
            } finally {
                if (a) throw a.error
            }
        }
        if (!d) throw new z(`protocol error: missing response message`, R.Unimplemented);
        if (f > 1) throw new z(`protocol error: received extra messages for client streaming method`, R.Unimplemented);
        return (l = r ? .onTrailer) == null || l.call(r, u.trailer), d
    }
}

function Ra(e, t) {
    return (n, r) => za(e.stream(t, r ? .signal, r ? .timeoutMs, r ? .headers, n, r ? .contextValues), r)
}

function za(e, t) {
    let n = (function() {
        return Na(this, arguments, function*() {
            var n, r;
            let i = yield G(e);
            (n = t ? .onHeader) == null || n.call(t, i.header), yield G(yield* Ma(ja(i.message))), (r = t ? .onTrailer) == null || r.call(t, i.trailer)
        })
    })()[Symbol.asyncIterator]();
    return {
        [Symbol.asyncIterator]: () => ({
            next: () => n.next()
        })
    }
}

function Ba(...e) {
    let t = new AbortController,
        n = e.filter(e => e !== void 0).concat(t.signal);
    for (let e of n) {
        if (e.aborted) {
            r.apply(e);
            break
        }
        e.addEventListener(`abort`, r)
    }

    function r() {
        t.signal.aborted || t.abort(Ha(this));
        for (let e of n) e.removeEventListener(`abort`, r)
    }
    return t
}

function Va(e) {
    let t = new AbortController,
        n = () => {
            t.abort(new z(`the operation timed out`, R.DeadlineExceeded))
        },
        r;
    return e !== void 0 && (e <= 0 ? n() : r = setTimeout(n, e)), {
        signal: t.signal,
        cleanup: () => clearTimeout(r)
    }
}

function Ha(e) {
    if (!e.aborted) return;
    if (e.reason !== void 0) return e.reason;
    let t = Error(`This operation was aborted`);
    return t.name = `AbortError`, t
}

function K() {
    return {
        get(e) {
            return e.id in this ? this[e.id] : e.defaultValue
        },
        set(e, t) {
            return this[e.id] = t, this
        },
        delete(e) {
            return delete this[e.id], this
        }
    }
}

function Ua(e, t) {
    return {
        id: Symbol(t ? .description),
        defaultValue: e
    }
}

function Wa(e) {
    let t;
    if (e.timeoutMs !== void 0) {
        let n = new Date(Date.now() + e.timeoutMs);
        t = () => n.getTime() - Date.now()
    } else t = () => void 0;
    let n = Va(e.timeoutMs),
        r = Ba(n.signal, e.requestSignal, e.shutdownSignal);
    return Object.assign(Object.assign({}, e), {
        signal: r.signal,
        timeoutMs: t,
        requestHeader: new Headers(e.requestHeader),
        responseHeader: new Headers(e.responseHeader),
        responseTrailer: new Headers(e.responseTrailer),
        abort(e) {
            n.cleanup(), r.abort(e)
        },
        values: e.contextValues ? ? K()
    })
}

function Ga(e, t) {
    return {
        kind: e.methodKind,
        method: e,
        impl: t
    }
}

function Ka(e, t) {
    let n = {
        service: e,
        methods: {}
    };
    for (let r of e.methods) {
        let i = t[r.localName];
        if (typeof i == `function`) i = i.bind(t);
        else {
            let t = `${e.typeName}.${r.name} is not implemented`;
            i = function() {
                throw new z(t, R.Unimplemented)
            }
        }
        n.methods[r.localName] = Ga(r, i)
    }
    return n
}

function qa(e) {
    let t = new Headers,
        n = new TextDecoder().decode(e).split(`\r
`);
    for (let e of n) {
        if (e === ``) continue;
        let n = e.indexOf(`:`);
        if (n > 0) {
            let r = e.substring(0, n).trim(),
                i = e.substring(n + 1).trim();
            t.append(r, i)
        }
    }
    return t
}

function Ja(e) {
    let t = [];
    return e.forEach((e, n) => {
        t.push(`${n}: ${e}\r\n`)
    }), new TextEncoder().encode(t.join(``))
}

function Ya() {
    return {
        serialize: Ja,
        parse: qa
    }
}
var Xa = `Content-Type`,
    Za = `Grpc-Encoding`,
    Qa = `Grpc-Accept-Encoding`,
    $a = `Grpc-Timeout`,
    eo = `Grpc-Status`,
    to = `Grpc-Message`,
    no = `Grpc-Status-Details-Bin`,
    ro = `Grpc-Message-Type`,
    io = `X-User-Agent`,
    ao = `X-Grpc-Web`,
    oo = /^application\/grpc-web(-text)?(?:\+(?:(json)(?:; ?charset=utf-?8)?|proto))?$/i,
    so = `application/grpc-web+proto`,
    co = `application/grpc-web+json`;

function lo(e) {
    let t = e ? .match(oo);
    if (t) return {
        text: !!t[1],
        binary: !t[2]
    }
}

function uo(e, t) {
    if (e === null) return {};
    let n = /^(\d{1,8})([HMSmun])$/.exec(e);
    if (n === null) return {
        error: new z(`protocol error: invalid grpc timeout value: ${e}`, R.InvalidArgument)
    };
    let r = {
        H: 3600 * 1e3,
        M: 60 * 1e3,
        S: 1e3,
        m: 1,
        u: .001,
        n: 1e-6
    }[n[2]] * parseInt(n[1]);
    return r > t ? {
        timeoutMs: r,
        error: new z(`timeout ${r}ms must be <= ${t}`, R.InvalidArgument)
    } : {
        timeoutMs: r
    }
}
var fo = P(I(`CgxzdGF0dXMucHJvdG8SCmdvb2dsZS5ycGMiTgoGU3RhdHVzEgwKBGNvZGUYASABKAUSDwoHbWVzc2FnZRgCIAEoCRIlCgdkZXRhaWxzGAMgAygLMhQuZ29vZ2xlLnByb3RvYnVmLkFueUJeCg5jb20uZ29vZ2xlLnJwY0ILU3RhdHVzUHJvdG9QAVo3Z29vZ2xlLmdvbGFuZy5vcmcvZ2VucHJvdG8vZ29vZ2xlYXBpcy9ycGMvc3RhdHVzO3N0YXR1c6ICA1JQQ2IGcHJvdG8z`, [Sr]), 0);

function po(e, t) {
    if (t) {
        if (t.metadata.forEach((t, n) => {
                e.append(n, t)
            }), e.set(eo, t.code.toString(10)), e.set(to, encodeURIComponent(t.rawMessage)), t.details.length > 0) {
            let n = M(fo, {
                code: t.code,
                message: t.rawMessage,
                details: t.details.map(e => `desc` in e ? wr(e.desc, M(e.desc, e.value)) : {
                    typeUrl: `type.googleapis.com/${e.type}`,
                    value: e.value
                })
            });
            e.set(no, Ki(n, fo))
        }
    } else e.set(eo, `0`);
    return e
}
var mo = 1024;

function ho(...e) {
    let t = new Map,
        n = e.reduce((e, t) => e.concat(`supported` in t ? t.supported : t), []);

    function r(e) {
        if (e === null || e.length == 0) return !1;
        let r = t.get(e);
        if (r !== void 0) return r;
        let i = n.some(t => t.test(e));
        return t.size < mo && t.set(e, i), i
    }
    return r.supported = n, r
}

function q(e, t) {
    return e.toString().replace(/\/?$/, `/${t.parent.typeName}/${t.name}`)
}

function go(e, t) {
    return M(e, t)
}

function _o(e, t) {
    function n(t) {
        return t.done === !0 ? t : {
            done: t.done,
            value: go(e, t.value)
        }
    }
    return {
        [Symbol.asyncIterator]() {
            let e = t[Symbol.asyncIterator](),
                r = {
                    next: () => e.next().then(n)
                };
            return e.throw !== void 0 && (r.throw = t => e.throw(t).then(n)), e.return !== void 0 && (r.return = t => e.return(t).then(n)), r
        }
    }
}

function vo(e, t) {
    if (!t) return e;
    for (let n of t.concat().reverse()) e = n(e);
    return e
}
var J = function(e) {
        return this instanceof J ? (this.v = e, this) : new J(e)
    },
    yo = function(e, t, n) {
        if (!Symbol.asyncIterator) throw TypeError(`Symbol.asyncIterator is not defined.`);
        var r = n.apply(e, t || []),
            i, a = [];
        return i = Object.create((typeof AsyncIterator == `function` ? AsyncIterator : Object).prototype), s(`next`), s(`throw`), s(`return`, o), i[Symbol.asyncIterator] = function() {
            return this
        }, i;

        function o(e) {
            return function(t) {
                return Promise.resolve(t).then(e, d)
            }
        }

        function s(e, t) {
            r[e] && (i[e] = function(t) {
                return new Promise(function(n, r) {
                    a.push([e, t, n, r]) > 1 || c(e, t)
                })
            }, t && (i[e] = t(i[e])))
        }

        function c(e, t) {
            try {
                l(r[e](t))
            } catch (e) {
                f(a[0][3], e)
            }
        }

        function l(e) {
            e.value instanceof J ? Promise.resolve(e.value.v).then(u, d) : f(a[0][2], e)
        }

        function u(e) {
            c(`next`, e)
        }

        function d(e) {
            c(`throw`, e)
        }

        function f(e, t) {
            e(t), a.shift(), a.length && c(a[0][0], a[0][1])
        }
    },
    bo = function(e) {
        if (!Symbol.asyncIterator) throw TypeError(`Symbol.asyncIterator is not defined.`);
        var t = e[Symbol.asyncIterator],
            n;
        return t ? t.call(e) : (e = typeof __values == `function` ? __values(e) : e[Symbol.iterator](), n = {}, r(`next`), r(`throw`), r(`return`), n[Symbol.asyncIterator] = function() {
            return this
        }, n);

        function r(t) {
            n[t] = e[t] && function(n) {
                return new Promise(function(r, a) {
                    n = e[t](n), i(r, a, n.done, n.value)
                })
            }
        }

        function i(e, t, n, r) {
            Promise.resolve(r).then(function(t) {
                e({
                    value: t,
                    done: n
                })
            }, t)
        }
    },
    xo = function(e) {
        var t, n;
        return t = {}, r(`next`), r(`throw`, function(e) {
            throw e
        }), r(`return`), t[Symbol.iterator] = function() {
            return this
        }, t;

        function r(r, i) {
            t[r] = e[r] ? function(t) {
                return (n = !n) ? {
                    value: J(e[r](t)),
                    done: !1
                } : i ? i(t) : t
            } : i
        }
    };
async function So(e, t, n, r) {
    let {
        message: i,
        header: a,
        trailer: o
    } = await vo(async n => Object.assign({
        message: go(e.method.output, await e.impl(n.message, Oo(t, n))),
        stream: !1,
        method: e.method
    }, Do(t, e)), r)(Object.assign({
        stream: !1,
        message: n,
        method: e.method
    }, Eo(t, e)));
    return ko(a, t.responseHeader), ko(o, t.responseTrailer), i
}

function Co(e, t, n) {
    switch (e.kind) {
        case `unary`:
            return function(r) {
                return yo(this, arguments, function*() {
                    yield yield J(yield J(So(e, t, yield J(To(r, `unary`)), n)))
                })
            };
        case `server_streaming`:
            return function(r) {
                return wo(e, t, r, n, async n => {
                    let r = _o(e.method.output, e.impl(await To(n.message, `server-streaming`), Oo(t, n)));
                    return Object.assign({
                        stream: !0,
                        message: r,
                        method: e.method
                    }, Do(t, e))
                })
            };
        case `client_streaming`:
            return function(r) {
                return wo(e, t, r, n, async n => Object.assign({
                    message: W([go(e.method.output, await e.impl(n.message, Oo(t, n)))]),
                    stream: !0,
                    method: e.method
                }, Do(t, e)))
            };
        case `bidi_streaming`:
            return function(r) {
                return wo(e, t, r, n, n => Promise.resolve(Object.assign({
                    message: _o(e.method.output, e.impl(n.message, Oo(t, n))),
                    stream: !0,
                    method: e.method
                }, Do(t, e))))
            }
    }
}

function wo(e, t, n, r, i) {
    return yo(this, arguments, function*() {
        let {
            message: a,
            header: o,
            trailer: s
        } = yield J(vo(i, r)(Object.assign({
            stream: !0,
            message: n,
            method: e.method
        }, Eo(t, e))));
        ko(o, t.responseHeader), yield J(yield* xo(bo(a))), ko(s, t.responseTrailer)
    })
}
async function To(e, t) {
    let n = e[Symbol.asyncIterator](),
        r = await n.next();
    if (r.done === !0) throw new z(`protocol error: missing input message for ${t} method`, R.Unimplemented);
    if ((await n.next()).done !== !0) throw new z(`protocol error: received extra input message for ${t} method`, R.Unimplemented);
    return r.value
}

function Eo(e, t) {
    return {
        requestMethod: e.requestMethod,
        url: e.url,
        signal: e.signal,
        header: e.requestHeader,
        service: t.method.parent,
        contextValues: e.values
    }
}

function Do(e, t) {
    return {
        service: t.method.parent,
        header: e.responseHeader,
        trailer: e.responseTrailer
    }
}

function Oo(e, t) {
    return Object.assign(Object.assign({}, e), {
        service: t.service,
        requestHeader: t.header,
        signal: t.signal,
        values: t.contextValues
    })
}

function ko(e, t) {
    e !== t && (t.forEach((e, n) => {
        t.delete(n)
    }), e.forEach((e, n) => {
        t.set(n, e)
    }))
}

function Ao(e) {
    let t = Object.assign({}, e);
    return t.ignoreUnknownFields ? ? = !0, t
}

function jo(e, t, n, r) {
    let i = No(Po(e.input, t), r),
        a = No(Fo(e.input, n), r),
        o = No(Po(e.output, t), r),
        s = No(Fo(e.output, n), r);
    return {
        getI(e) {
            return e ? i : a
        },
        getO(e) {
            return e ? o : s
        }
    }
}

function Mo(e, t, n, r) {
    let i = t ? Po(e.input, r) : Fo(e.input, n);
    return {
        parse: (t ? Po(e.output, r) : Fo(e.output, n)).parse,
        serialize: i.serialize
    }
}

function No(e, t) {
    return {
        serialize(n) {
            let r = e.serialize(n);
            return ta(t.writeMaxBytes, r.byteLength), r
        },
        parse(n) {
            return na(t.readMaxBytes, n.byteLength, !0), e.parse(n)
        }
    }
}

function Po(e, t) {
    return {
        parse(n) {
            try {
                return mr(e, n, t)
            } catch (e) {
                throw new z(`parse binary: ${e instanceof Error?e.message:String(e)}`, R.Internal)
            }
        },
        serialize(n) {
            try {
                return Fn(e, n, t)
            } catch (e) {
                throw new z(`serialize binary: ${e instanceof Error?e.message:String(e)}`, R.Internal)
            }
        }
    }
}

function Fo(e, t) {
    let n = t ? .textEncoder ? ? new TextEncoder,
        r = t ? .textDecoder ? ? new TextDecoder,
        i = Ao(t);
    return {
        parse(t) {
            try {
                return hi(e, r.decode(t), i)
            } catch (e) {
                throw z.from(e, R.InvalidArgument)
            }
        },
        serialize(t) {
            try {
                let r = Zr(e, t, i);
                return n.encode(r)
            } catch (e) {
                throw z.from(e, R.Internal)
            }
        }
    }
}

function Io(e) {
    if (!(typeof e.body == `object` && e.body !== null && Symbol.asyncIterator in e.body)) throw Error(`byte stream required, but received JSON`)
}
var Lo = {
        status: 200
    },
    Ro = {
        status: 415
    },
    zo = {
        status: 405
    },
    Bo = {
        status: 505
    };

function Vo(e) {
    e ? ? = {};
    let t = e.acceptCompression ? [...e.acceptCompression] : [],
        n = e.requireConnectProtocolHeader ? ? !1,
        r = e.maxTimeoutMs ? ? 2 ** 53 - 1;
    return Object.assign(Object.assign({
        acceptCompression: t
    }, ea(e.readMaxBytes, e.writeMaxBytes, e.compressMinBytes)), {
        jsonOptions: e.jsonOptions,
        binaryOptions: e.binaryOptions,
        maxTimeoutMs: r,
        shutdownSignal: e.shutdownSignal,
        requireConnectProtocolHeader: n,
        interceptors: e.interceptors ? ? []
    })
}

function Ho(e, t) {
    return Object.entries(e.methods).map(([, e]) => Uo(e, t))
}

function Uo(e, t) {
    return Wo(t.map(t => t(e)))
}

function Wo(e) {
    if (e.length == 0) throw new z(`at least one protocol is required`, R.Internal);
    let t = e[0].service,
        n = e[0].method,
        r = e[0].requestPath;
    if (e.some(e => e.service !== t || e.method !== n)) throw new z(`cannot negotiate protocol for different RPCs`, R.Internal);
    if (e.some(e => e.requestPath !== r)) throw new z(`cannot negotiate protocol for different requestPaths`, R.Internal);
    async function i(t) {
        if (n.methodKind == `bidi_streaming` && t.httpVersion.startsWith(`1.`)) return Object.assign(Object.assign({}, Bo), {
            header: new Headers({
                Connection: `close`
            })
        });
        let r = t.header.get(`Content-Type`) ? ? ``,
            i = e.filter(e => e.allowedMethods.includes(t.method));
        if (i.length == 0) return zo;
        if (i.length == 1 && r === ``) {
            let e = i[0];
            return e(t)
        }
        let a = i.filter(e => e.supportedContentType(r));
        if (a.length == 0) return Ro;
        let o = a[0];
        return o(t)
    }
    return Object.assign(i, {
        service: t,
        method: n,
        requestPath: r,
        supportedContentType: ho(...e.map(e => e.supportedContentType)),
        protocolNames: e.flatMap(e => e.protocolNames).filter((e, t, n) => n.indexOf(e) === t),
        allowedMethods: e.flatMap(e => e.allowedMethods).filter((e, t, n) => n.indexOf(e) === t)
    })
}
var Go = `grpc-web`,
    Ko = `POST`;

function qo(e) {
    let t = Vo(e),
        n = Ya();

    function r(e) {
        let r = Jo(t, n, e);
        return Object.assign(r, {
            protocolNames: [Go],
            allowedMethods: [Ko],
            supportedContentType: ho(oo),
            requestPath: q(`/`, e.method),
            service: e.method.parent,
            method: e.method
        })
    }
    return r.protocolName = Go, r
}

function Jo(e, t, n) {
    let r = jo(n.method, e.binaryOptions, e.jsonOptions, e);
    return async function(i) {
        Io(i);
        let a = lo(i.header.get(Xa));
        if (a == null || a.text) return Ro;
        if (i.method !== Ko) return zo;
        let o = uo(i.header.get($a), e.maxTimeoutMs),
            s = Wa(Object.assign(Object.assign({}, n), {
                service: n.method.parent,
                requestMethod: i.method,
                protocolName: Go,
                timeoutMs: o.timeoutMs,
                shutdownSignal: e.shutdownSignal,
                requestSignal: i.signal,
                requestHeader: i.header,
                url: i.url,
                responseHeader: {
                    [Xa]: a.binary ? so : co
                },
                responseTrailer: {
                    [eo]: `0`
                },
                contextValues: i.contextValues
            })),
            c = Xi(e.acceptCompression, i.header.get(Za), i.header.get(Qa), Qa);
        c.response && s.responseHeader.set(Za, c.response.name);
        let l = U(i.body, ha(() => {
                if (c.error) throw c.error;
                if (o.error) throw o.error
            }), xa(e.readMaxBytes), ya(c.request, e.readMaxBytes), _a(r.getI(a.binary), 128)),
            u = Co(n, s, e.interceptors)(l)[Symbol.asyncIterator](),
            d = U({
                [Symbol.asyncIterator]() {
                    return {
                        next: () => u.next(),
                        throw: e => (s.abort(e), u.throw ? .call(u, e) ? ? Promise.reject({
                            done: !0
                        })),
                        return: e => (s.abort(), u.return ? .call(u, e) ? ? Promise.resolve({
                            done: !0,
                            value: e
                        }))
                    }
                }
            }, ga(r.getO(a.binary)), ma(e => (s.abort(e), e instanceof z ? po(s.responseTrailer, e) : e !== void 0 && po(s.responseTrailer, new z(`internal error`, R.Internal, void 0, void 0, e)), {
                flags: 128,
                data: t.serialize(s.responseTrailer)
            })), va(c.response, e.compressMinBytes), ba(), {
                propagateDownStreamError: !0
            });
        return Object.assign(Object.assign({}, Lo), {
            body: await wa(d),
            header: s.responseHeader
        })
    }
}
var Yo = /^application\/grpc(?:\+(?:(json)(?:; ?charset=utf-?8)?|proto))?$/i,
    Xo = `application/grpc+proto`,
    Zo = `application/grpc+json`;

function Qo(e) {
    let t = e ? .match(Yo);
    if (t) return {
        binary: !t[1]
    }
}
var $o = `grpc`,
    es = `POST`;

function ts(e) {
    let t = Vo(e);

    function n(e) {
        let n = ns(t, e);
        return Object.assign(n, {
            protocolNames: [$o],
            allowedMethods: [es],
            supportedContentType: ho(Yo),
            requestPath: q(`/`, e.method),
            service: e.method.parent,
            method: e.method
        })
    }
    return n.protocolName = $o, n
}

function ns(e, t) {
    let n = jo(t.method, e.binaryOptions, e.jsonOptions, e);
    return async function(r) {
        Io(r);
        let i = Qo(r.header.get(Xa));
        if (i == null) return Ro;
        if (r.method !== es) return zo;
        let a = uo(r.header.get($a), e.maxTimeoutMs),
            o = Wa(Object.assign(Object.assign({}, t), {
                service: t.method.parent,
                requestMethod: r.method,
                protocolName: $o,
                timeoutMs: a.timeoutMs,
                shutdownSignal: e.shutdownSignal,
                requestSignal: r.signal,
                requestHeader: r.header,
                url: r.url,
                responseHeader: {
                    [Xa]: i.binary ? Xo : Zo
                },
                responseTrailer: {
                    [eo]: `0`
                },
                contextValues: r.contextValues
            })),
            s = Xi(e.acceptCompression, r.header.get(Za), r.header.get(Qa), Qa);
        s.response && o.responseHeader.set(Za, s.response.name);
        let c = U(r.body, ha(() => {
                if (s.error) throw s.error;
                if (a.error) throw a.error
            }), xa(e.readMaxBytes), ya(s.request, e.readMaxBytes), _a(n.getI(i.binary))),
            l = Co(t, o, e.interceptors)(c)[Symbol.asyncIterator](),
            u = U({
                [Symbol.asyncIterator]() {
                    return {
                        next: () => l.next(),
                        throw: e => (o.abort(e), l.throw ? .call(l, e) ? ? Promise.reject({
                            done: !0
                        })),
                        return: e => (o.abort(), l.return ? .call(l, e) ? ? Promise.resolve({
                            done: !0,
                            value: e
                        }))
                    }
                }
            }, ga(n.getO(i.binary)), va(s.response, e.compressMinBytes), ba(), ma(e => {
                o.abort(e), e instanceof z ? po(o.responseTrailer, e) : e !== void 0 && po(o.responseTrailer, new z(`internal error`, R.Internal, void 0, void 0, e))
            }), {
                propagateDownStreamError: !0
            });
        return Object.assign(Object.assign({}, Lo), {
            body: await wa(u),
            header: o.responseHeader,
            trailer: o.responseTrailer
        })
    }
}
var rs = /^application\/(connect\+)?(?:(json)(?:; ?charset=utf-?8)?|(proto))$/i,
    is = /^application\/(?:json(?:; ?charset=utf-?8)?|proto)$/i,
    as = /^application\/connect\+?(?:json(?:; ?charset=utf-?8)?|proto)$/i,
    os = `application/proto`,
    ss = `application/json`,
    cs = `application/connect+proto`,
    ls = `application/connect+json`,
    us = `proto`,
    ds = `json`;

function fs(e) {
    let t = e ? .match(rs);
    if (t) return {
        stream: !!t[1],
        binary: !!t[3]
    }
}

function ps(e) {
    switch (e) {
        case us:
            return {
                stream: !1,
                binary: !0
            };
        case ds:
            return {
                stream: !1,
                binary: !1
            };
        default:
            return
    }
}
var ms = function(e, t) {
    var n = {};
    for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == `function`)
        for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
    return n
};

function hs(e, t, n) {
    if (t && new Headers(t).forEach((e, t) => n.metadata.append(t, e)), typeof e != `object` || !e || Array.isArray(e)) throw n;
    let r = n.code;
    `code` in e && typeof e.code == `string` && (r = Wi(e.code) ? ? r);
    let i = e.message;
    if (i != null && typeof i != `string`) throw n;
    let a = new z(i ? ? ``, r, t);
    if (`details` in e && Array.isArray(e.details))
        for (let t of e.details) {
            if (typeof t != `object` || !t || Array.isArray(t) || typeof t.type != `string` || typeof t.value != `string`) throw n;
            try {
                a.details.push({
                    type: t.type,
                    value: bt(t.value),
                    debug: t.debug
                })
            } catch {
                throw n
            }
        }
    return a
}

function gs(e, t, n) {
    let r;
    try {
        r = JSON.parse(new TextDecoder().decode(e))
    } catch {
        throw n
    }
    return hs(r, t, n)
}

function _s(e, t) {
    let n = {
        code: Hi(e.code)
    };
    return e.rawMessage.length > 0 && (n.message = e.rawMessage), e.details.length > 0 && (n.details = e.details.map(e => {
        if (`desc` in e) {
            let n = M(e.desc, e.value),
                r = {
                    type: e.desc.typeName,
                    value: Fn(e.desc, n)
                };
            try {
                r.debug = Xr(e.desc, n, t)
            } catch {}
            return r
        }
        return e
    }).map(e => {
        var {
            value: t
        } = e, n = ms(e, [`value`]);
        return Object.assign(Object.assign({}, n), {
            value: xt(t, `std_raw`)
        })
    })), n
}

function vs(e, t) {
    let n = new TextEncoder;
    try {
        let r = _s(e, t),
            i = JSON.stringify(r);
        return n.encode(i)
    } catch (e) {
        throw new z(`failed to serialize Connect Error: ${e instanceof Error?e.message:String(e)}`, R.Internal)
    }
}

function ys(e) {
    let t = new z(`invalid end stream`, R.Unknown),
        n;
    try {
        n = JSON.parse(typeof e == `string` ? e : new TextDecoder().decode(e))
    } catch {
        throw t
    }
    if (typeof n != `object` || !n || Array.isArray(n)) throw t;
    let r = new Headers;
    if (`metadata` in n) {
        if (typeof n.metadata != `object` || n.metadata == null || Array.isArray(n.metadata)) throw t;
        for (let [e, i] of Object.entries(n.metadata)) {
            if (!Array.isArray(i) || i.some(e => typeof e != `string`)) throw t;
            for (let t of i) r.append(e, t)
        }
    }
    return {
        metadata: r,
        error: `error` in n && n.error != null ? hs(n.error, r, t) : void 0
    }
}

function bs(e, t, n) {
    let r = {};
    t !== void 0 && (r.error = _s(t, n), e = Ji(e, t.metadata));
    let i = !1,
        a = {};
    return e.forEach((e, t) => {
        i = !0, a[t] = [e]
    }), i && (r.metadata = a), r
}

function xs(e) {
    let t = new TextEncoder;
    return {
        serialize(n) {
            try {
                let r = bs(n.metadata, n.error, e),
                    i = JSON.stringify(r);
                return t.encode(i)
            } catch (e) {
                throw new z(`failed to serialize EndStreamResponse: ${e instanceof Error?e.message:String(e)}`, R.Internal)
            }
        },
        parse(e) {
            try {
                return ys(e)
            } catch (e) {
                throw new z(`failed to parse EndStreamResponse: ${e instanceof Error?e.message:String(e)}`, R.InvalidArgument)
            }
        }
    }
}
var Y = `Content-Type`,
    Ss = `Content-Length`,
    X = `Content-Encoding`,
    Z = `Connect-Content-Encoding`,
    Cs = `Accept-Encoding`,
    ws = `Connect-Accept-Encoding`,
    Ts = `Connect-Timeout-Ms`,
    Q = `Connect-Protocol-Version`,
    Es = `User-Agent`;

function Ds(e) {
    switch (e) {
        case 400:
            return R.Internal;
        case 401:
            return R.Unauthenticated;
        case 403:
            return R.PermissionDenied;
        case 404:
            return R.Unimplemented;
        case 429:
            return R.Unavailable;
        case 502:
            return R.Unavailable;
        case 503:
            return R.Unavailable;
        case 504:
            return R.Unavailable;
        default:
            return R.Unknown
    }
}

function Os(e) {
    switch (e) {
        case R.Canceled:
            return 499;
        case R.Unknown:
            return 500;
        case R.InvalidArgument:
            return 400;
        case R.DeadlineExceeded:
            return 504;
        case R.NotFound:
            return 404;
        case R.AlreadyExists:
            return 409;
        case R.PermissionDenied:
            return 403;
        case R.ResourceExhausted:
            return 429;
        case R.FailedPrecondition:
            return 400;
        case R.Aborted:
            return 409;
        case R.OutOfRange:
            return 400;
        case R.Unimplemented:
            return 501;
        case R.Internal:
            return 500;
        case R.Unavailable:
            return 503;
        case R.DataLoss:
            return 500;
        case R.Unauthenticated:
            return 401;
        default:
            return 500
    }
}

function ks(e, t) {
    if (e === null) return {};
    let n = /^\d{1,10}$/.exec(e);
    if (n === null) return {
        error: new z(`protocol error: invalid connect timeout value: ${e}`, R.InvalidArgument)
    };
    let r = parseInt(n[0]);
    return r > t ? {
        timeoutMs: r,
        error: new z(`timeout ${r}ms must be <= ${t}`, R.InvalidArgument)
    } : {
        timeoutMs: parseInt(n[0])
    }
}
var As = `connect`,
    js = `encoding`,
    Ms = `compression`,
    Ns = `base64`;

function Ps(e) {
    let t = new Headers,
        n = new Headers;
    return e.forEach((e, r) => {
        r.toLowerCase().startsWith(`trailer-`) ? n.append(r.substring(8), e) : t.append(r, e)
    }), [t, n]
}

function Fs(e, t) {
    let n = new Headers(e);
    return t.forEach((e, t) => {
        n.append(`trailer-${t}`, e)
    }), n
}

function Is(e) {
    let t = e.get(Q);
    if (t === null) throw new z(`missing required header: set ${Q} to "1"`, R.InvalidArgument);
    if (t !== `1`) throw new z(`${Q} must be "1": got "${t}"`, R.InvalidArgument)
}

function Ls(e) {
    let t = e.get(As);
    if (t === null) throw new z(`missing required parameter: set ${As} to "v1"`, R.InvalidArgument);
    if (t !== `v1`) throw new z(`${As} must be "v1": got "${t}"`, R.InvalidArgument)
}
var Rs = `connect`,
    zs = `POST`,
    Bs = `GET`;

function Vs(e) {
    let t = Vo(e),
        n = xs(t.jsonOptions);

    function r(e) {
        let r, i, a = jo(e.method, t.binaryOptions, t.jsonOptions, t);
        switch (e.kind) {
            case `unary`:
                i = is, r = Hs(t, e, a);
                break;
            default:
                i = as, r = Ks(t, e, a, n);
                break
        }
        let o = [zs];
        return e.method.idempotency === er.NO_SIDE_EFFECTS && o.push(Bs), Object.assign(r, {
            protocolNames: [Rs],
            supportedContentType: ho(i),
            allowedMethods: o,
            requestPath: q(`/`, e.method),
            service: e.method.parent,
            method: e.method
        })
    }
    return r.protocolName = Rs, r
}

function Hs(e, t, n) {
    return async function(r) {
        let i = r.method == Bs;
        if (i && t.method.idempotency != er.NO_SIDE_EFFECTS) return zo;
        let a = new URL(r.url).searchParams,
            o = i ? a.get(Ms) : r.header.get(X),
            s = i ? ps(a.get(js)) : fs(r.header.get(Y));
        if (s == null || s.stream) return Ro;
        let c = ks(r.header.get(Ts), e.maxTimeoutMs),
            l = Wa(Object.assign(Object.assign({}, t), {
                service: t.method.parent,
                requestMethod: r.method,
                protocolName: Rs,
                timeoutMs: c.timeoutMs,
                shutdownSignal: e.shutdownSignal,
                requestSignal: r.signal,
                requestHeader: r.header,
                url: r.url,
                responseHeader: {
                    [Y]: s.binary ? os : ss
                },
                contextValues: r.contextValues
            })),
            u = Xi(e.acceptCompression, o, r.header.get(Cs), Cs),
            d = Lo.status,
            f;
        try {
            if (e.requireConnectProtocolHeader && (i ? Ls(a) : Is(r.header)), u.error) throw u.error;
            if (c.error) throw c.error;
            let o;
            o = i ? await Ws(e.readMaxBytes, u.request, a) : await Us(e.readMaxBytes, u.request, r);
            let d = await So(t, l, Gs(t.method, s.binary, n, o), e.interceptors);
            f = n.getO(s.binary).serialize(d)
        } catch (t) {
            l.abort(t);
            let n;
            n = t instanceof z ? t : new z(`internal error`, R.Internal, void 0, void 0, t), d = Os(n.code), l.responseHeader.set(Y, ss), n.metadata.forEach((e, t) => {
                l.responseHeader.set(t, e)
            }), f = vs(n, e.jsonOptions)
        } finally {
            l.abort()
        }
        u.response && f.byteLength >= e.compressMinBytes && (f = await u.response.compress(f), l.responseHeader.set(X, u.response.name));
        let p = Fs(l.responseHeader, l.responseTrailer);
        return p.set(Ss, f.byteLength.toString(10)), {
            status: d,
            body: W([f]),
            header: p
        }
    }
}
async function Us(e, t, n) {
    if (typeof n.body == `object` && n.body !== null && Symbol.asyncIterator in n.body) {
        let r = await Sa(n.body, e, n.header.get(Ss));
        return t && (r = await t.decompress(r, e)), r
    }
    return n.body
}
async function Ws(e, t, n) {
    let r = n.get(Ns),
        i = n.get(`message`) ? ? ``,
        a;
    return a = r === `1` ? bt(i) : new TextEncoder().encode(i), t && (a = await t.decompress(a, e)), a
}

function Gs(e, t, n, r) {
    if (r instanceof Uint8Array) return n.getI(t).parse(r);
    if (t) throw new z(`received parsed JSON request body, but content-type indicates binary format`, R.Internal);
    try {
        return gi(e.input, r)
    } catch (e) {
        throw z.from(e, R.InvalidArgument)
    }
}

function Ks(e, t, n, r) {
    return async function(i) {
        Io(i);
        let a = fs(i.header.get(Y));
        if (a == null || !a.stream) return Ro;
        if (i.method !== zs) return zo;
        let o = ks(i.header.get(Ts), e.maxTimeoutMs),
            s = Wa(Object.assign(Object.assign({}, t), {
                service: t.method.parent,
                requestMethod: i.method,
                protocolName: Rs,
                timeoutMs: o.timeoutMs,
                shutdownSignal: e.shutdownSignal,
                requestSignal: i.signal,
                requestHeader: i.header,
                url: i.url,
                responseHeader: {
                    [Y]: a.binary ? cs : ls
                },
                contextValues: i.contextValues
            })),
            c = Xi(e.acceptCompression, i.header.get(Z), i.header.get(ws), ws);
        c.response && s.responseHeader.set(Z, c.response.name);
        let l = U(i.body, ha(() => {
                if (e.requireConnectProtocolHeader && Is(i.header), c.error) throw c.error;
                if (o.error) throw o.error
            }), xa(e.readMaxBytes), ya(c.request, e.readMaxBytes), _a(n.getI(a.binary), 2)),
            u = Co(t, s, e.interceptors)(l)[Symbol.asyncIterator](),
            d = U({
                [Symbol.asyncIterator]() {
                    return {
                        next: () => u.next(),
                        throw: e => (s.abort(e), u.throw ? .call(u, e) ? ? Promise.reject({
                            done: !0
                        })),
                        return: e => (s.abort(), u.return ? .call(u, e) ? ? Promise.resolve({
                            done: !0,
                            value: e
                        }))
                    }
                }
            }, ga(n.getO(a.binary)), ma(e => {
                s.abort(e);
                let t = {
                    metadata: s.responseTrailer
                };
                return e instanceof z ? t.error = e : e !== void 0 && (t.error = new z(`internal error`, R.Internal, void 0, void 0, e)), {
                    flags: 2,
                    data: r.serialize(t)
                }
            }), va(c.response, e.compressMinBytes), ba(), {
                propagateDownStreamError: !0
            });
        return Object.assign(Object.assign({}, Lo), {
            body: await wa(d),
            header: s.responseHeader
        })
    }
}

function qs(e) {
    let t = Js(e),
        n = [],
        r = {
            handlers: n,
            service: (e, i, a) => {
                let {
                    protocols: o
                } = Js(a, t);
                return n.push(...Ho(Ka(e, i), o)), r
            },
            rpc: (e, i, a) => {
                let {
                    protocols: o
                } = Js(a, t);
                return n.push(Uo(Ga(e, i), o)), r
            }
        };
    return r
}

function Js(e, t) {
    if (t && !e) return t;
    let n = t ? Object.assign(Object.assign({}, Vo(t.options)), e) : Object.assign(Object.assign({}, e), Vo(e ? ? {})),
        r = [];
    if (e ? .grpc !== !1 && r.push(ts(n)), e ? .grpcWeb !== !1 && r.push(qo(n)), e ? .connect !== !1 && r.push(Vs(n)), r.length === 0) throw new z(`cannot create handler, all protocols are disabled`, R.InvalidArgument);
    return {
        options: n,
        protocols: r
    }
}
var Ys = {
    allowedMethods: [`POST`, `GET`],
    allowedHeaders: [Y, Q, Ts, Z, ws, X, Cs, ro, ao, io, $a],
    exposedHeaders: [eo, to, no, X, Z]
};

function Xs(e, t, n, r, i) {
    let a = new Headers(r ? ? {});
    return n !== void 0 && a.set(Ts, `${n}`), a.set(Y, e == `unary` ? t ? os : ss : t ? cs : ls), a.set(Q, `1`), !a.has(`User-Agent`) && i && a.set(Es, `connect-es/2.1.1`), a
}

function Zs(e, t, n, r, i, a, o) {
    let s = Xs(e, t, n, r, o);
    if (a != null) {
        let t = e == `unary` ? X : Z;
        s.set(t, a.name)
    }
    if (i.length > 0) {
        let t = e == `unary` ? Cs : ws;
        s.set(t, i.map(e => e.name).join(`,`))
    }
    return s
}

function Qs(e, t, n, r) {
    let i = r.get(Y),
        a = fs(i);
    if (n !== 200) {
        let t = new z(`HTTP ${n}`, Ds(n), r);
        if (e == `unary` && a && !a.binary) return {
            isUnaryError: !0,
            unaryError: t
        };
        throw t
    }
    let o = {
        binary: t,
        stream: e !== `unary`
    };
    if (a ? .binary !== o.binary || a.stream !== o.stream) throw new z(`unsupported content type ${i}`, a === void 0 ? R.Unknown : R.Internal, r);
    return {
        isUnaryError: !1
    }
}

function $s(e, t, n, r, i) {
    let a, o = i.get(e == `unary` ? X : Z);
    if (o != null && o.toLowerCase() !== `identity` && (a = t.find(e => e.name === o), !a)) throw new z(`unsupported response encoding "${o}"`, R.Internal, i);
    return Object.assign({
        compression: a
    }, Qs(e, n, r, i))
}
var ec = `application/`;

function tc(e, t) {
    return t ? xt(e, `url`) : encodeURIComponent(new TextDecoder().decode(e))
}

function nc(e, t, n) {
    let r = `?connect=v1`,
        i = e.header.get(Y);
    i ? .indexOf(ec) === 0 && (r += `&encoding=` + encodeURIComponent(i.slice(12)));
    let a = e.header.get(X);
    a !== null && a !== `identity` && (r += `&compression=` + encodeURIComponent(a), n = !0), n && (r += `&base64=1`), r += `&message=` + tc(t, n);
    let o = e.url + r,
        s = new Headers(e.header);
    for (let e of [Q, Y, Ss, X, Cs]) s.delete(e);
    return Object.assign(Object.assign({}, e), {
        requestMethod: `GET`,
        url: o,
        header: s
    })
}

function rc(e) {
    let t = vo(e.next, e.interceptors),
        [n, r, i] = ac(e);
    return t(Object.assign(Object.assign({}, e.req), {
        message: go(e.req.method.input, e.req.message),
        signal: n
    })).then(e => (i(), e), r)
}

function ic(e) {
    let t = vo(e.next, e.interceptors),
        [n, r, i] = ac(e),
        a = Object.assign(Object.assign({}, e.req), {
            message: _o(e.req.method.input, e.req.message),
            signal: n
        }),
        o = !1;
    return n.addEventListener(`abort`, function() {
        var t, n;
        let r = e.req.message[Symbol.asyncIterator]();
        o || (t = r.throw) == null || t.call(r, this.reason).catch(() => {}), (n = r.return) == null || n.call(r).catch(() => {})
    }), t(a).then(e => Object.assign(Object.assign({}, e), {
        message: {
            [Symbol.asyncIterator]() {
                let t = e.message[Symbol.asyncIterator]();
                return {
                    next() {
                        return t.next().then(e => (e.done == 1 && (o = !0, i()), e), r)
                    }
                }
            }
        }
    }), r)
}

function ac(e) {
    let {
        signal: t,
        cleanup: n
    } = Va(e.timeoutMs), r = Ba(e.signal, t);
    return [r.signal, function(e) {
        let i = z.from(t.aborted ? Ha(t) : e);
        return r.abort(i), n(), Promise.reject(i)
    }, function() {
        n(), r.abort()
    }]
}
var oc = function(e) {
        if (!Symbol.asyncIterator) throw TypeError(`Symbol.asyncIterator is not defined.`);
        var t = e[Symbol.asyncIterator],
            n;
        return t ? t.call(e) : (e = typeof __values == `function` ? __values(e) : e[Symbol.iterator](), n = {}, r(`next`), r(`throw`), r(`return`), n[Symbol.asyncIterator] = function() {
            return this
        }, n);

        function r(t) {
            n[t] = e[t] && function(n) {
                return new Promise(function(r, a) {
                    n = e[t](n), i(r, a, n.done, n.value)
                })
            }
        }

        function i(e, t, n, r) {
            Promise.resolve(r).then(function(t) {
                e({
                    value: t,
                    done: n
                })
            }, t)
        }
    },
    $ = function(e) {
        return this instanceof $ ? (this.v = e, this) : new $(e)
    },
    sc = function(e, t, n) {
        if (!Symbol.asyncIterator) throw TypeError(`Symbol.asyncIterator is not defined.`);
        var r = n.apply(e, t || []),
            i, a = [];
        return i = Object.create((typeof AsyncIterator == `function` ? AsyncIterator : Object).prototype), s(`next`), s(`throw`), s(`return`, o), i[Symbol.asyncIterator] = function() {
            return this
        }, i;

        function o(e) {
            return function(t) {
                return Promise.resolve(t).then(e, d)
            }
        }

        function s(e, t) {
            r[e] && (i[e] = function(t) {
                return new Promise(function(n, r) {
                    a.push([e, t, n, r]) > 1 || c(e, t)
                })
            }, t && (i[e] = t(i[e])))
        }

        function c(e, t) {
            try {
                l(r[e](t))
            } catch (e) {
                f(a[0][3], e)
            }
        }

        function l(e) {
            e.value instanceof $ ? Promise.resolve(e.value.v).then(u, d) : f(a[0][2], e)
        }

        function u(e) {
            c(`next`, e)
        }

        function d(e) {
            c(`throw`, e)
        }

        function f(e, t) {
            e(t), a.shift(), a.length && c(a[0][0], a[0][1])
        }
    };

function cc(e) {
    return {
        async unary(t, n, r, i, a, o) {
            let s = jo(t, e.binaryOptions, e.jsonOptions, e);
            return r = r === void 0 ? e.defaultTimeoutMs : r <= 0 ? void 0 : r, await rc({
                interceptors: e.interceptors,
                signal: n,
                timeoutMs: r,
                req: {
                    stream: !1,
                    service: t.parent,
                    method: t,
                    requestMethod: `POST`,
                    url: q(e.baseUrl, t),
                    header: Zs(t.methodKind, e.useBinaryFormat, r, i, e.acceptCompression, e.sendCompression, !0),
                    contextValues: o ? ? K(),
                    message: a
                },
                next: async n => {
                    let r = s.getI(e.useBinaryFormat).serialize(n.message);
                    e.sendCompression && r.byteLength > e.compressMinBytes ? (r = await e.sendCompression.compress(r), n.header.set(X, e.sendCompression.name)) : n.header.delete(X);
                    let i = e.useHttpGet === !0 && t.idempotency === er.NO_SIDE_EFFECTS,
                        a;
                    i ? n = nc(n, r, e.useBinaryFormat) : a = W([r]);
                    let o = await e.httpClient({
                            url: n.url,
                            method: n.requestMethod,
                            header: n.header,
                            signal: n.signal,
                            body: a
                        }),
                        {
                            compression: c,
                            isUnaryError: l,
                            unaryError: u
                        } = $s(t.methodKind, e.acceptCompression, e.useBinaryFormat, o.status, o.header),
                        [d, f] = Ps(o.header),
                        p = await ua(o.body, fa(e.readMaxBytes, o.header.get(Ss)), {
                            propagateDownStreamError: !1
                        });
                    if (c && (p = await c.decompress(p, e.readMaxBytes)), l) throw gs(p, Ji(d, f), u);
                    return {
                        stream: !1,
                        service: t.parent,
                        method: t,
                        header: d,
                        message: s.getO(e.useBinaryFormat).parse(p),
                        trailer: f
                    }
                }
            })
        },
        async stream(t, n, r, i, a, o) {
            let s = jo(t, e.binaryOptions, e.jsonOptions, e),
                c = xs(e.jsonOptions);
            return r = r === void 0 ? e.defaultTimeoutMs : r <= 0 ? void 0 : r, ic({
                interceptors: e.interceptors,
                signal: n,
                timeoutMs: r,
                req: {
                    stream: !0,
                    service: t.parent,
                    method: t,
                    requestMethod: `POST`,
                    url: q(e.baseUrl, t),
                    header: Zs(t.methodKind, e.useBinaryFormat, r, i, e.acceptCompression, e.sendCompression, !0),
                    contextValues: o ? ? K(),
                    message: a
                },
                next: async n => {
                    let r = await e.httpClient({
                            url: n.url,
                            method: `POST`,
                            header: n.header,
                            signal: n.signal,
                            body: U(n.message, ga(s.getI(e.useBinaryFormat)), va(e.sendCompression, e.compressMinBytes), ba(), {
                                propagateDownStreamError: !0
                            })
                        }),
                        {
                            compression: i
                        } = $s(t.methodKind, e.acceptCompression, e.useBinaryFormat, r.status, r.header),
                        a = Object.assign(Object.assign({}, n), {
                            header: r.header,
                            trailer: new Headers,
                            message: U(r.body, xa(e.readMaxBytes), ya(i ? ? null, e.readMaxBytes), _a(s.getO(e.useBinaryFormat), 2, c), function(e) {
                                return sc(this, arguments, function*() {
                                    var t, n, i, o;
                                    let s = !1;
                                    try {
                                        for (var c = !0, l = oc(e), u; u = yield $(l.next()), t = u.done, !t; c = !0) {
                                            o = u.value, c = !1;
                                            let e = o;
                                            if (e.end) {
                                                if (s) throw new z(`protocol error: received extra EndStreamResponse`, R.InvalidArgument);
                                                if (s = !0, e.value.error) {
                                                    let t = e.value.error;
                                                    throw r.header.forEach((e, n) => {
                                                        t.metadata.append(n, e)
                                                    }), t
                                                }
                                                e.value.metadata.forEach((e, t) => a.trailer.set(t, e));
                                                continue
                                            }
                                            if (s) throw new z(`protocol error: received extra message after EndStreamResponse`, R.InvalidArgument);
                                            yield yield $(e.value)
                                        }
                                    } catch (e) {
                                        n = {
                                            error: e
                                        }
                                    } finally {
                                        try {
                                            !c && !t && (i = l.return) && (yield $(i.call(l)))
                                        } finally {
                                            if (n) throw n.error
                                        }
                                    }
                                    if (!s) throw new z(`protocol error: missing EndStreamResponse`, R.InvalidArgument)
                                })
                            }, {
                                propagateDownStreamError: !0
                            })
                        });
                    return a
                }
            })
        }
    }
}

function lc(e) {
    let t = new Map;
    for (let n of e) t.set(n.requestPath, n);
    return async e => {
        let n = new URL(e.url).pathname,
            r = t.get(n);
        if (!r) throw new z(`RouterHttpClient: no handler registered for ${n}`, R.Unimplemented);
        let i = e.signal ? ? new AbortController().signal,
            a = await uc(i, r({
                body: e.body ? ? W([]),
                httpVersion: `2.0`,
                method: e.method,
                url: e.url,
                header: e.header,
                signal: i
            }));
        return {
            body: U(a.body ? ? W([]), e => ({
                [Symbol.asyncIterator]() {
                    let t = e[Symbol.asyncIterator](),
                        n = {
                            next() {
                                return uc(i, t.next())
                            }
                        };
                    return t.throw !== void 0 && (n.throw = e => t.throw(e)), t.return !== void 0 && (n.return = e => t.return(e)), n
                }
            })),
            header: new Headers(a.header),
            status: a.status,
            trailer: new Headers(a.trailer)
        }
    }
}

function uc(e, t) {
    let n, r = new Promise((t, r) => {
        let i = () => r(Ha(e));
        if (e.aborted) return i();
        e.addEventListener(`abort`, i), n = () => e.removeEventListener(`abort`, i)
    });
    return Promise.race([r, t]).finally(n)
}

function dc(e, t) {
    let n = qs(Object.assign(Object.assign({}, t ? .router ? ? {}), {
        connect: !0
    }));
    return e(n), cc(Object.assign({
        httpClient: lc(n.handlers),
        baseUrl: `https://in-memory`,
        useBinaryFormat: !0,
        interceptors: [],
        acceptCompression: [],
        sendCompression: null,
        compressMinBytes: 2 ** 53 - 1,
        readMaxBytes: 2 ** 53 - 1,
        writeMaxBytes: 2 ** 53 - 1
    }, t ? .transport ? ? {}))
}
var fc = e({
    Code: () => R,
    ConnectError: () => z,
    appendHeaders: () => Ji,
    cors: () => Ys,
    createCallbackClient: () => Da,
    createClient: () => Pa,
    createConnectRouter: () => qs,
    createContextKey: () => Ua,
    createContextValues: () => K,
    createHandlerContext: () => Wa,
    createMethodImplSpec: () => Ga,
    createRouterTransport: () => dc,
    createServiceImplSpec: () => Ka,
    decodeBinaryHeader: () => qi,
    encodeBinaryHeader: () => Ki,
    makeAnyClient: () => Yi
});

function pc() {
    try {
        new Headers
    } catch {
        throw Error(`connect-web requires the fetch API. Are you running on an old version of Node.js? Node.js is not supported in Connect for Web - please stay tuned for Connect for Node.`)
    }
}
var mc = function(e) {
        return this instanceof mc ? (this.v = e, this) : new mc(e)
    },
    hc = function(e, t, n) {
        if (!Symbol.asyncIterator) throw TypeError(`Symbol.asyncIterator is not defined.`);
        var r = n.apply(e, t || []),
            i, a = [];
        return i = Object.create((typeof AsyncIterator == `function` ? AsyncIterator : Object).prototype), s(`next`), s(`throw`), s(`return`, o), i[Symbol.asyncIterator] = function() {
            return this
        }, i;

        function o(e) {
            return function(t) {
                return Promise.resolve(t).then(e, d)
            }
        }

        function s(e, t) {
            r[e] && (i[e] = function(t) {
                return new Promise(function(n, r) {
                    a.push([e, t, n, r]) > 1 || c(e, t)
                })
            }, t && (i[e] = t(i[e])))
        }

        function c(e, t) {
            try {
                l(r[e](t))
            } catch (e) {
                f(a[0][3], e)
            }
        }

        function l(e) {
            e.value instanceof mc ? Promise.resolve(e.value.v).then(u, d) : f(a[0][2], e)
        }

        function u(e) {
            c(`next`, e)
        }

        function d(e) {
            c(`throw`, e)
        }

        function f(e, t) {
            e(t), a.shift(), a.length && c(a[0][0], a[0][1])
        }
    },
    gc = {
        redirect: `error`
    };

function _c(e) {
    pc();
    let t = e.useBinaryFormat ? ? !1;
    return {
        async unary(n, r, i, a, o, s) {
            let {
                serialize: c,
                parse: l
            } = Mo(n, t, e.jsonOptions, e.binaryOptions);
            return i = i === void 0 ? e.defaultTimeoutMs : i <= 0 ? void 0 : i, await rc({
                interceptors: e.interceptors,
                signal: r,
                timeoutMs: i,
                req: {
                    stream: !1,
                    service: n.parent,
                    method: n,
                    requestMethod: `POST`,
                    url: q(e.baseUrl, n),
                    header: Xs(n.methodKind, t, i, a, !1),
                    contextValues: s ? ? K(),
                    message: o
                },
                next: async r => {
                    let i = e.useHttpGet === !0 && n.idempotency === er.NO_SIDE_EFFECTS,
                        a = null;
                    i ? r = nc(r, c(r.message), t) : a = c(r.message);
                    let o = await (e.fetch ? ? globalThis.fetch)(r.url, Object.assign(Object.assign({}, gc), {
                            method: r.requestMethod,
                            headers: r.header,
                            signal: r.signal,
                            body: a
                        })),
                        {
                            isUnaryError: s,
                            unaryError: u
                        } = Qs(n.methodKind, t, o.status, o.headers);
                    if (s) throw hs(await o.json(), Ji(...Ps(o.headers)), u);
                    let [d, f] = Ps(o.headers);
                    return {
                        stream: !1,
                        service: n.parent,
                        method: n,
                        header: d,
                        message: t ? l(new Uint8Array(await o.arrayBuffer())) : gi(n.output, await o.json(), Ao(e.jsonOptions)),
                        trailer: f
                    }
                }
            })
        },
        async stream(n, r, i, a, o, s) {
            let {
                serialize: c,
                parse: l
            } = Mo(n, t, e.jsonOptions, e.binaryOptions);

            function u(e, t, n, r) {
                return hc(this, arguments, function*() {
                    let i = aa(e).getReader(),
                        a = !1;
                    for (;;) {
                        let e = yield mc(i.read());
                        if (e.done) break;
                        let {
                            flags: r,
                            data: o
                        } = e.value;
                        if ((r & 1) == 1) throw new z(`protocol error: received unsupported compressed output`, R.Internal);
                        if ((r & 2) == 2) {
                            a = !0;
                            let e = ys(o);
                            if (e.error) {
                                let t = e.error;
                                throw n.forEach((e, n) => {
                                    t.metadata.append(n, e)
                                }), t
                            }
                            e.metadata.forEach((e, n) => t.set(n, e));
                            continue
                        }
                        yield yield mc(l(o))
                    }
                    if (`throwIfAborted` in r && r.throwIfAborted(), !a) throw `missing EndStreamResponse`
                })
            }
            async function d(e) {
                if (n.methodKind != `server_streaming`) throw `The fetch API does not support streaming request bodies`;
                let t = await e[Symbol.asyncIterator]().next();
                if (t.done == 1) throw `missing request message`;
                return ca(0, c(t.value))
            }
            return i = i === void 0 ? e.defaultTimeoutMs : i <= 0 ? void 0 : i, await ic({
                interceptors: e.interceptors,
                timeoutMs: i,
                signal: r,
                req: {
                    stream: !0,
                    service: n.parent,
                    method: n,
                    requestMethod: `POST`,
                    url: q(e.baseUrl, n),
                    header: Xs(n.methodKind, t, i, a, !1),
                    contextValues: s ? ? K(),
                    message: o
                },
                next: async r => {
                    let i = await (e.fetch ? ? globalThis.fetch)(r.url, Object.assign(Object.assign({}, gc), {
                        method: r.requestMethod,
                        headers: r.header,
                        signal: r.signal,
                        body: await d(r.message)
                    }));
                    if (Qs(n.methodKind, t, i.status, i.headers), i.body === null) throw `missing response body`;
                    let a = new Headers;
                    return Object.assign(Object.assign({}, r), {
                        header: i.headers,
                        trailer: a,
                        message: u(i.body, a, i.headers, r.signal)
                    })
                }
            })
        }
    }
}
var vc = e => async n => {
        if (n.stream) return e(n);
        let r = performance.now(),
            i = n.method.name;
        try {
            let a = await e(n);
            return t.addAction(`rpc`, {
                method: i,
                ms: performance.now() - r,
                ok: !0
            }), a
        } catch (e) {
            let n = e instanceof z ? R[e.code] : `unknown`;
            throw t.addAction(`rpc`, {
                method: i,
                ms: performance.now() - r,
                ok: !1,
                code: n
            }), e
        }
    },
    yc = e({
        dispatchAgentEvent: () => Sc,
        dispatchOmEvent: () => xc,
        omEvent: () => bc
    });

function bc(e, t) {
    return new CustomEvent(e, {
        detail: t
    })
}

function xc(e, t) {
    return l().emitOmEvent(e, t), !0
}

function Sc(e, t) {
    return l().emitOmEvent(e, t), !0
}
var Cc = typeof window < `u` && `showDirectoryPicker` in window,
    wc = typeof CompressionStream < `u`,
    Tc = typeof VideoEncoder < `u`;
typeof window < `u` && (`SpeechRecognition` in window || `webkitSpeechRecognition` in window);
var Ec = typeof navigator < `u` && (/iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === `MacIntel` && (navigator.maxTouchPoints ? ? 0) > 1),
    Dc = typeof window < `u` && typeof window.matchMedia == `function` && window.matchMedia(`(pointer: coarse)`).matches,
    Oc = typeof window < `u` && (!!window.__OMELETTE_DESKTOP__ || typeof navigator < `u` && /claude(nest|gov)?\//i.test(navigator.userAgent)),
    kc = Oc && typeof window < `u` && window.self === window.top,
    Ac = !Oc,
    jc = () => typeof screen < `u` && `isExtended` in screen && screen.isExtended,
    Mc = typeof window < `u` && `getScreenDetails` in window,
    Nc = (() => {
        if (typeof Intl > `u` || typeof Intl.Segmenter != `function`) return null;
        try {
            return new Intl.Segmenter(typeof navigator < `u` && navigator.language || `en-US`, {
                granularity: `word`
            })
        } catch {
            try {
                return new Intl.Segmenter(`en-US`, {
                    granularity: `word`
                })
            } catch {
                return null
            }
        }
    })(),
    Pc;

function Fc() {
    return Pc ? ? = (async () => {
        try {
            let e = new OffscreenCanvas(1, 1);
            return e.getContext(`2d`), (await e.convertToBlob({
                type: `image/webp`
            })).type === `image/webp`
        } catch {
            return !1
        }
    })()
}
var Ic = `window-management`;
async function Lc() {
    if (!Mc) return null;
    try {
        return await window.getScreenDetails()
    } catch {
        return null
    }
}

function Rc(e) {
    let t = e.currentScreen;
    return e.screens.find(e => e !== t && e.isInternal) ? ? e.screens.find(e => e !== t) ? ? null
}
var zc = `auth proxy redirected; reloading`,
    Bc = 1024;
async function Vc(e) {
    let t = e ? .body;
    if (!wc || e ? .method !== `POST` || !(t instanceof Uint8Array) || t.byteLength < Bc) return e ? ? {};
    try {
        let n = new Blob([t]).stream().pipeThrough(new CompressionStream(`gzip`)),
            r = new Uint8Array(await new Response(n).arrayBuffer());
        if (r.byteLength >= t.byteLength) return e;
        let i = new Headers(e.headers);
        return i.set(`Content-Encoding`, `gzip`), { ...e,
            body: r,
            headers: i
        }
    } catch (t) {
        return r(`design.connect_gzip_request_failed`, {
            attrs: {
                error_kind: t instanceof Error ? t.name : typeof t
            }
        }), e
    }
}
var Hc = async (e, t) => {
        let n = await fetch(e, { ...await Vc(t),
            redirect: `manual`
        });
        if (n.type === `opaqueredirect`) throw xc(`auth-expired`), TypeError(zc);
        return n
    },
    Uc = e({
        ORG_UUID_HEADER: () => a,
        TAB_ID_HEADER: () => Kc,
        getOmeletteClient: () => il,
        getOrgUuid: () => n,
        getProjectToOrgProject: () => dl,
        projectTypeFromString: () => cl,
        projectTypeToString: () => sl,
        protoToOrgProject: () => ul,
        setOrgUuid: () => i,
        tabIDIfReady: () => Qc,
        tabIDReady: () => Zc,
        writeReceiptFromResponse: () => tl
    }),
    Wc = e => t => {
        if (o()) throw s(`interceptor`), Error(c);
        return e(t)
    },
    Gc = e => t => {
        let r = n();
        return r && t.header.set(a, r), e(t)
    },
    Kc = `x-omelette-tab-id`,
    qc = `om-tab-id`,
    Jc = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
async function Yc() {
    let e;
    try {
        e = sessionStorage.getItem(qc)
    } catch {
        return crypto.randomUUID()
    }
    e && !Jc.test(e) && (e = null);
    let t = typeof navigator < `u` ? navigator.locks : void 0,
        n = e => new Promise(n => {
            if (!t) return n(!1);
            try {
                t.request(e, {
                    ifAvailable: !0
                }, e => e === null ? n(!1) : (n(!0), new Promise(() => {}))).catch(() => n(!1))
            } catch {
                n(!1)
            }
        }),
        r = crypto.randomUUID();
    e && await n(`om-tab-` + e) ? r = e : await n(`om-tab-` + r);
    try {
        sessionStorage.setItem(qc, r)
    } catch {}
    return r
}
var Xc, Zc = Yc().then(e => (Xc = e, e));

function Qc() {
    return Xc
}
var $c = e => async t => (t.header.set(Kc, await Zc), e(t)),
    el = e => t => (t.header.set(`X-Client-Version`, `aa93b5ed4aefa2e80e4c4e122a3ffe4818a9769a`), e(t));

function tl(e, t, n) {
    let r = t ? .projectId;
    if (typeof r != `string` || !r) return null;
    if (e === `WriteFiles`) {
        let e = n ? .files;
        if (!Array.isArray(e)) return null;
        let t = e.flatMap(e => typeof e ? .path == `string` && typeof e ? .version == `bigint` && e.version !== 0 n ? [{
            path: e.path,
            version: e.version
        }] : []);
        return t.length > 0 ? {
            projectId: r,
            files: t
        } : null
    }
    if (e === `EditFile`) {
        let e = n;
        return typeof e ? .path != `string` || typeof e ? .version != `bigint` || e.version === 0 n ? null : {
            projectId: r,
            files: [{
                path: e.path,
                version: e.version
            }]
        }
    }
    return null
}
var nl = e => async t => {
        let n = await e(t);
        if (!t.stream && !n.stream) {
            let e = tl(t.method.name, t.message, n.message);
            e && xc(`agent-write-receipt`, e)
        }
        return n
    },
    rl = null;

function il() {
    return rl || = Pa(Br, _c({
        baseUrl: new URL(`/design/`, self.location.origin).href,
        useBinaryFormat: !0,
        fetch: Hc,
        interceptors: [Wc, Gc, $c, el, vc, nl]
    })), rl
}
var al = {
        [L.UNSPECIFIED]: `project`,
        [L.PROJECT]: `project`,
        [L.TEMPLATE]: `template`,
        [L.DESIGN_SYSTEM]: `design_system`
    },
    ol = {
        project: L.PROJECT,
        template: L.TEMPLATE,
        design_system: L.DESIGN_SYSTEM
    };

function sl(e) {
    return al[e] ? ? `project`
}

function cl(e) {
    return ol[e]
}

function ll(e) {
    return e ? new Date(Number(e.seconds) * 1e3).toISOString() : null
}

function ul(e) {
    return {
        projectId: e.projectId,
        name: e.name,
        type: sl(e.type),
        publishedAt: ll(e.publishedAt),
        templateTitle: e.templateTitle || e.name,
        description: e.description || null,
        introText: e.introText || null,
        ownerUuid: e.ownerUuid,
        ownerEmail: e.ownerEmail,
        ownerDisplayName: e.ownerDisplayName,
        teamCanEdit: e.sharing ? .teamCanEdit ? ? !1,
        isOwned: e.isOwned,
        canEdit: e.canEdit,
        callerCanEdit: e.callerCanEdit,
        callerCanDelete: e.callerCanDelete,
        callerCanPublish: e.callerCanPublish,
        viewedAt: ll(e.viewedAt),
        updatedAt: ll(e.updatedAt)
    }
}

function dl(e) {
    return {
        projectId: e.projectId,
        name: e.name,
        type: sl(e.type),
        publishedAt: ll(e.publishedAt),
        templateTitle: e.templateTitle || e.name,
        description: e.description || null,
        introText: e.introText || null,
        ownerUuid: e.ownerUuid,
        ownerEmail: e.ownerEmail,
        ownerDisplayName: e.ownerDisplayName,
        teamCanEdit: e.sharing ? .teamCanEdit ? ? !1,
        isOwned: !1,
        canEdit: e.callerCanEdit,
        callerCanEdit: e.callerCanEdit,
        viewedAt: null,
        updatedAt: ll(e.updatedAt)
    }
}
export {
    R as A, Nc as C, bc as D, yc as E, Ir as F, M as I, Lr as M, Fr as N, fc as O, zr as P, Rc as S, xc as T, Mc as _, cl as a, kc as b, Qc as c, Fc as d, Lc as f, Ac as g, Tc as h, dl as i, Rr as j, z as k, Zc as l, jc as m, Uc as n, sl as o, Cc as p, il as r, ul as s, Kc as t, Ic as u, Ec as v, Sc as w, Dc as x, Oc as y
};