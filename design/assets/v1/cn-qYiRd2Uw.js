function e(t) {
    var n, r, i = ``;
    if (typeof t == `string` || typeof t == `number`) i += t;
    else if (typeof t == `object`)
        if (Array.isArray(t)) {
            var a = t.length;
            for (n = 0; n < a; n++) t[n] && (r = e(t[n])) && (i && (i += ` `), i += r)
        } else
            for (r in t) t[r] && (i && (i += ` `), i += r);
    return i
}

function t() {
    for (var t, n, r = 0, i = ``, a = arguments.length; r < a; r++)(t = arguments[r]) && (n = e(t)) && (i && (i += ` `), i += n);
    return i
}
var n = (e, t) => {
        let n = Array(e.length + t.length);
        for (let t = 0; t < e.length; t++) n[t] = e[t];
        for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
        return n
    },
    r = (e, t) => ({
        classGroupId: e,
        validator: t
    }),
    i = (e = new Map, t = null, n) => ({
        nextPart: e,
        validators: t,
        classGroupId: n
    }),
    a = `-`,
    o = [],
    s = `arbitrary..`,
    c = e => {
        let t = u(e),
            {
                conflictingClassGroups: r,
                conflictingClassGroupModifiers: i
            } = e;
        return {
            getClassGroupId: e => {
                if (e.startsWith(`[`) && e.endsWith(`]`)) return ee(e);
                let n = e.split(a);
                return l(n, +(n[0] === `` && n.length > 1), t)
            },
            getConflictingClassGroupIds: (e, t) => {
                if (t) {
                    let t = i[e],
                        a = r[e];
                    return t ? a ? n(a, t) : t : a || o
                }
                return r[e] || o
            }
        }
    },
    l = (e, t, n) => {
        if (e.length - t === 0) return n.classGroupId;
        let r = e[t],
            i = n.nextPart.get(r);
        if (i) {
            let n = l(e, t + 1, i);
            if (n) return n
        }
        let o = n.validators;
        if (o === null) return;
        let s = t === 0 ? e.join(a) : e.slice(t).join(a),
            c = o.length;
        for (let e = 0; e < c; e++) {
            let t = o[e];
            if (t.validator(s)) return t.classGroupId
        }
    },
    ee = e => e.slice(1, -1).indexOf(`:`) === -1 ? void 0 : (() => {
        let t = e.slice(1, -1),
            n = t.indexOf(`:`),
            r = t.slice(0, n);
        return r ? s + r : void 0
    })(),
    u = e => {
        let {
            theme: t,
            classGroups: n
        } = e;
        return te(n, t)
    },
    te = (e, t) => {
        let n = i();
        for (let r in e) {
            let i = e[r];
            d(i, n, r, t)
        }
        return n
    },
    d = (e, t, n, r) => {
        let i = e.length;
        for (let a = 0; a < i; a++) {
            let i = e[a];
            f(i, t, n, r)
        }
    },
    f = (e, t, n, r) => {
        if (typeof e == `string`) {
            p(e, t, n);
            return
        }
        if (typeof e == `function`) {
            m(e, t, n, r);
            return
        }
        h(e, t, n, r)
    },
    p = (e, t, n) => {
        let r = e === `` ? t : g(t, e);
        r.classGroupId = n
    },
    m = (e, t, n, i) => {
        if (_(e)) {
            d(e(i), t, n, i);
            return
        }
        t.validators === null && (t.validators = []), t.validators.push(r(n, e))
    },
    h = (e, t, n, r) => {
        let i = Object.entries(e),
            a = i.length;
        for (let e = 0; e < a; e++) {
            let [a, o] = i[e];
            d(o, g(t, a), n, r)
        }
    },
    g = (e, t) => {
        let n = e,
            r = t.split(a),
            o = r.length;
        for (let e = 0; e < o; e++) {
            let t = r[e],
                a = n.nextPart.get(t);
            a || (a = i(), n.nextPart.set(t, a)), n = a
        }
        return n
    },
    _ = e => `isThemeGetter` in e && e.isThemeGetter === !0,
    v = e => {
        if (e < 1) return {
            get: () => void 0,
            set: () => {}
        };
        let t = 0,
            n = Object.create(null),
            r = Object.create(null),
            i = (i, a) => {
                n[i] = a, t++, t > e && (t = 0, r = n, n = Object.create(null))
            };
        return {
            get(e) {
                let t = n[e];
                if (t !== void 0) return t;
                if ((t = r[e]) !== void 0) return i(e, t), t
            },
            set(e, t) {
                e in n ? n[e] = t : i(e, t)
            }
        }
    },
    y = `!`,
    b = `:`,
    ne = [],
    x = (e, t, n, r, i) => ({
        modifiers: e,
        hasImportantModifier: t,
        baseClassName: n,
        maybePostfixModifierPosition: r,
        isExternal: i
    }),
    S = e => {
        let {
            prefix: t,
            experimentalParseClassName: n
        } = e, r = e => {
            let t = [],
                n = 0,
                r = 0,
                i = 0,
                a, o = e.length;
            for (let s = 0; s < o; s++) {
                let o = e[s];
                if (n === 0 && r === 0) {
                    if (o === b) {
                        t.push(e.slice(i, s)), i = s + 1;
                        continue
                    }
                    if (o === `/`) {
                        a = s;
                        continue
                    }
                }
                o === `[` ? n++ : o === `]` ? n-- : o === `(` ? r++ : o === `)` && r--
            }
            let s = t.length === 0 ? e : e.slice(i),
                c = s,
                l = !1;
            s.endsWith(y) ? (c = s.slice(0, -1), l = !0) : s.startsWith(y) && (c = s.slice(1), l = !0);
            let ee = a && a > i ? a - i : void 0;
            return x(t, l, c, ee)
        };
        if (t) {
            let e = t + b,
                n = r;
            r = t => t.startsWith(e) ? n(t.slice(e.length)) : x(ne, !1, t, void 0, !0)
        }
        if (n) {
            let e = r;
            r = t => n({
                className: t,
                parseClassName: e
            })
        }
        return r
    },
    re = e => {
        let t = new Map;
        return e.orderSensitiveModifiers.forEach((e, n) => {
            t.set(e, 1e6 + n)
        }), e => {
            let n = [],
                r = [];
            for (let i = 0; i < e.length; i++) {
                let a = e[i],
                    o = a[0] === `[`,
                    s = t.has(a);
                o || s ? (r.length > 0 && (r.sort(), n.push(...r), r = []), n.push(a)) : r.push(a)
            }
            return r.length > 0 && (r.sort(), n.push(...r)), n
        }
    },
    ie = e => ({
        cache: v(e.cacheSize),
        parseClassName: S(e),
        sortModifiers: re(e),
        postfixLookupClassGroupIds: C(e),
        ...c(e)
    }),
    C = e => {
        let t = Object.create(null),
            n = e.postfixLookupClassGroups;
        if (n)
            for (let e = 0; e < n.length; e++) t[n[e]] = !0;
        return t
    },
    ae = /\s+/,
    w = (e, t) => {
        let {
            parseClassName: n,
            getClassGroupId: r,
            getConflictingClassGroupIds: i,
            sortModifiers: a,
            postfixLookupClassGroupIds: o
        } = t, s = [], c = e.trim().split(ae), l = ``;
        for (let e = c.length - 1; e >= 0; --e) {
            let t = c[e],
                {
                    isExternal: ee,
                    modifiers: u,
                    hasImportantModifier: te,
                    baseClassName: d,
                    maybePostfixModifierPosition: f
                } = n(t);
            if (ee) {
                l = t + (l.length > 0 ? ` ` + l : l);
                continue
            }
            let p = !!f,
                m;
            if (p) {
                m = r(d.substring(0, f));
                let e = m && o[m] ? r(d) : void 0;
                e && e !== m && (m = e, p = !1)
            } else m = r(d);
            if (!m) {
                if (!p) {
                    l = t + (l.length > 0 ? ` ` + l : l);
                    continue
                }
                if (m = r(d), !m) {
                    l = t + (l.length > 0 ? ` ` + l : l);
                    continue
                }
                p = !1
            }
            let h = u.length === 0 ? `` : u.length === 1 ? u[0] : a(u).join(`:`),
                g = te ? h + y : h,
                _ = g + m;
            if (s.indexOf(_) > -1) continue;
            s.push(_);
            let v = i(m, p);
            for (let e = 0; e < v.length; ++e) {
                let t = v[e];
                s.push(g + t)
            }
            l = t + (l.length > 0 ? ` ` + l : l)
        }
        return l
    },
    T = (...e) => {
        let t = 0,
            n, r, i = ``;
        for (; t < e.length;)(n = e[t++]) && (r = E(n)) && (i && (i += ` `), i += r);
        return i
    },
    E = e => {
        if (typeof e == `string`) return e;
        let t, n = ``;
        for (let r = 0; r < e.length; r++) e[r] && (t = E(e[r])) && (n && (n += ` `), n += t);
        return n
    },
    D = (e, ...t) => {
        let n, r, i, a, o = o => (n = ie(t.reduce((e, t) => t(e), e())), r = n.cache.get, i = n.cache.set, a = s, s(o)),
            s = e => {
                let t = r(e);
                if (t) return t;
                let a = w(e, n);
                return i(e, a), a
            };
        return a = o, (...e) => a(T(...e))
    },
    O = [],
    k = e => {
        let t = t => t[e] || O;
        return t.isThemeGetter = !0, t
    },
    A = /^\[(?:(\w[\w-]*):)?(.+)\]$/i,
    j = /^\((?:(\w[\w-]*):)?(.+)\)$/i,
    oe = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,
    se = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
    ce = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
    M = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,
    N = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
    P = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
    F = e => oe.test(e),
    I = e => !!e && !Number.isNaN(Number(e)),
    L = e => !!e && Number.isInteger(Number(e)),
    le = e => e.endsWith(`%`) && I(e.slice(0, -1)),
    R = e => se.test(e),
    ue = () => !0,
    z = e => ce.test(e) && !M.test(e),
    B = () => !1,
    V = e => N.test(e),
    de = e => P.test(e),
    fe = e => !H(e) && !G(e),
    pe = e => e.startsWith(`@container`) && (e[10] === `/` && e[11] !== void 0 || e[11] === `s` && e[16] !== void 0 && e.startsWith(`-size/`, 10) || e[11] === `n` && e[18] !== void 0 && e.startsWith(`-normal/`, 10)),
    me = e => q(e, Ee, B),
    H = e => A.test(e),
    U = e => q(e, De, z),
    he = e => q(e, Oe, I),
    ge = e => q(e, Ae, ue),
    _e = e => q(e, ke, B),
    ve = e => q(e, Y, B),
    ye = e => q(e, X, de),
    W = e => q(e, je, V),
    G = e => j.test(e),
    K = e => J(e, De),
    be = e => J(e, ke),
    xe = e => J(e, Y),
    Se = e => J(e, Ee),
    Ce = e => J(e, X),
    we = e => J(e, je, !0),
    Te = e => J(e, Ae, !0),
    q = (e, t, n) => {
        let r = A.exec(e);
        return r ? r[1] ? t(r[1]) : n(r[2]) : !1
    },
    J = (e, t, n = !1) => {
        let r = j.exec(e);
        return r ? r[1] ? t(r[1]) : n : !1
    },
    Y = e => e === `position` || e === `percentage`,
    X = e => e === `image` || e === `url`,
    Ee = e => e === `length` || e === `size` || e === `bg-size`,
    De = e => e === `length`,
    Oe = e => e === `number`,
    ke = e => e === `family-name`,
    Ae = e => e === `number` || e === `weight`,
    je = e => e === `shadow`,
    Me = () => {
        let e = k(`color`),
            t = k(`font`),
            n = k(`text`),
            r = k(`font-weight`),
            i = k(`tracking`),
            a = k(`leading`),
            o = k(`breakpoint`),
            s = k(`container`),
            c = k(`spacing`),
            l = k(`radius`),
            ee = k(`shadow`),
            u = k(`inset-shadow`),
            te = k(`text-shadow`),
            d = k(`drop-shadow`),
            f = k(`blur`),
            p = k(`perspective`),
            m = k(`aspect`),
            h = k(`ease`),
            g = k(`animate`),
            _ = () => [`auto`, `avoid`, `all`, `avoid-page`, `page`, `left`, `right`, `column`],
            v = () => [`center`, `top`, `bottom`, `left`, `right`, `top-left`, `left-top`, `top-right`, `right-top`, `bottom-right`, `right-bottom`, `bottom-left`, `left-bottom`],
            y = () => [...v(), G, H],
            b = () => [`auto`, `hidden`, `clip`, `visible`, `scroll`],
            ne = () => [`auto`, `contain`, `none`],
            x = () => [G, H, c],
            S = () => [F, `full`, `auto`, ...x()],
            re = () => [L, `none`, `subgrid`, G, H],
            ie = () => [`auto`, {
                span: [`full`, L, G, H]
            }, L, G, H],
            C = () => [L, `auto`, G, H],
            ae = () => [`auto`, `min`, `max`, `fr`, G, H],
            w = () => [`start`, `end`, `center`, `between`, `around`, `evenly`, `stretch`, `baseline`, `center-safe`, `end-safe`],
            T = () => [`start`, `end`, `center`, `stretch`, `center-safe`, `end-safe`],
            E = () => [`auto`, ...x()],
            D = () => [F, `auto`, `full`, `dvw`, `dvh`, `lvw`, `lvh`, `svw`, `svh`, `min`, `max`, `fit`, ...x()],
            O = () => [F, `screen`, `full`, `dvw`, `lvw`, `svw`, `min`, `max`, `fit`, ...x()],
            A = () => [F, `screen`, `full`, `lh`, `dvh`, `lvh`, `svh`, `min`, `max`, `fit`, ...x()],
            j = () => [e, G, H],
            oe = () => [...v(), xe, ve, {
                position: [G, H]
            }],
            se = () => [`no-repeat`, {
                repeat: [``, `x`, `y`, `space`, `round`]
            }],
            ce = () => [`auto`, `cover`, `contain`, Se, me, {
                size: [G, H]
            }],
            M = () => [le, K, U],
            N = () => [``, `none`, `full`, l, G, H],
            P = () => [``, I, K, U],
            z = () => [`solid`, `dashed`, `dotted`, `double`],
            B = () => [`normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`],
            V = () => [I, le, xe, ve],
            de = () => [``, `none`, f, G, H],
            q = () => [`none`, I, G, H],
            J = () => [`none`, I, G, H],
            Y = () => [I, G, H],
            X = () => [F, `full`, ...x()];
        return {
            cacheSize: 500,
            theme: {
                animate: [`spin`, `ping`, `pulse`, `bounce`],
                aspect: [`video`],
                blur: [R],
                breakpoint: [R],
                color: [ue],
                container: [R],
                "drop-shadow": [R],
                ease: [`in`, `out`, `in-out`],
                font: [fe],
                "font-weight": [`thin`, `extralight`, `light`, `normal`, `medium`, `semibold`, `bold`, `extrabold`, `black`],
                "inset-shadow": [R],
                leading: [`none`, `tight`, `snug`, `normal`, `relaxed`, `loose`],
                perspective: [`dramatic`, `near`, `normal`, `midrange`, `distant`, `none`],
                radius: [R],
                shadow: [R],
                spacing: [`px`, I],
                text: [R],
                "text-shadow": [R],
                tracking: [`tighter`, `tight`, `normal`, `wide`, `wider`, `widest`]
            },
            classGroups: {
                aspect: [{
                    aspect: [`auto`, `square`, F, H, G, m]
                }],
                container: [`container`],
                "container-type": [{
                    "@container": [``, `normal`, `size`, G, H]
                }],
                "container-named": [pe],
                columns: [{
                    columns: [I, H, G, s]
                }],
                "break-after": [{
                    "break-after": _()
                }],
                "break-before": [{
                    "break-before": _()
                }],
                "break-inside": [{
                    "break-inside": [`auto`, `avoid`, `avoid-page`, `avoid-column`]
                }],
                "box-decoration": [{
                    "box-decoration": [`slice`, `clone`]
                }],
                box: [{
                    box: [`border`, `content`]
                }],
                display: [`block`, `inline-block`, `inline`, `flex`, `inline-flex`, `table`, `inline-table`, `table-caption`, `table-cell`, `table-column`, `table-column-group`, `table-footer-group`, `table-header-group`, `table-row-group`, `table-row`, `flow-root`, `grid`, `inline-grid`, `contents`, `list-item`, `hidden`],
                sr: [`sr-only`, `not-sr-only`],
                float: [{
                    float: [`right`, `left`, `none`, `start`, `end`]
                }],
                clear: [{
                    clear: [`left`, `right`, `both`, `none`, `start`, `end`]
                }],
                isolation: [`isolate`, `isolation-auto`],
                "object-fit": [{
                    object: [`contain`, `cover`, `fill`, `none`, `scale-down`]
                }],
                "object-position": [{
                    object: y()
                }],
                overflow: [{
                    overflow: b()
                }],
                "overflow-x": [{
                    "overflow-x": b()
                }],
                "overflow-y": [{
                    "overflow-y": b()
                }],
                overscroll: [{
                    overscroll: ne()
                }],
                "overscroll-x": [{
                    "overscroll-x": ne()
                }],
                "overscroll-y": [{
                    "overscroll-y": ne()
                }],
                position: [`static`, `fixed`, `absolute`, `relative`, `sticky`],
                inset: [{
                    inset: S()
                }],
                "inset-x": [{
                    "inset-x": S()
                }],
                "inset-y": [{
                    "inset-y": S()
                }],
                start: [{
                    "inset-s": S(),
                    start: S()
                }],
                end: [{
                    "inset-e": S(),
                    end: S()
                }],
                "inset-bs": [{
                    "inset-bs": S()
                }],
                "inset-be": [{
                    "inset-be": S()
                }],
                top: [{
                    top: S()
                }],
                right: [{
                    right: S()
                }],
                bottom: [{
                    bottom: S()
                }],
                left: [{
                    left: S()
                }],
                visibility: [`visible`, `invisible`, `collapse`],
                z: [{
                    z: [L, `auto`, G, H]
                }],
                basis: [{
                    basis: [F, `full`, `auto`, s, ...x()]
                }],
                "flex-direction": [{
                    flex: [`row`, `row-reverse`, `col`, `col-reverse`]
                }],
                "flex-wrap": [{
                    flex: [`nowrap`, `wrap`, `wrap-reverse`]
                }],
                flex: [{
                    flex: [I, F, `auto`, `initial`, `none`, H]
                }],
                grow: [{
                    grow: [``, I, G, H]
                }],
                shrink: [{
                    shrink: [``, I, G, H]
                }],
                order: [{
                    order: [L, `first`, `last`, `none`, G, H]
                }],
                "grid-cols": [{
                    "grid-cols": re()
                }],
                "col-start-end": [{
                    col: ie()
                }],
                "col-start": [{
                    "col-start": C()
                }],
                "col-end": [{
                    "col-end": C()
                }],
                "grid-rows": [{
                    "grid-rows": re()
                }],
                "row-start-end": [{
                    row: ie()
                }],
                "row-start": [{
                    "row-start": C()
                }],
                "row-end": [{
                    "row-end": C()
                }],
                "grid-flow": [{
                    "grid-flow": [`row`, `col`, `dense`, `row-dense`, `col-dense`]
                }],
                "auto-cols": [{
                    "auto-cols": ae()
                }],
                "auto-rows": [{
                    "auto-rows": ae()
                }],
                gap: [{
                    gap: x()
                }],
                "gap-x": [{
                    "gap-x": x()
                }],
                "gap-y": [{
                    "gap-y": x()
                }],
                "justify-content": [{
                    justify: [...w(), `normal`]
                }],
                "justify-items": [{
                    "justify-items": [...T(), `normal`]
                }],
                "justify-self": [{
                    "justify-self": [`auto`, ...T()]
                }],
                "align-content": [{
                    content: [`normal`, ...w()]
                }],
                "align-items": [{
                    items: [...T(), {
                        baseline: [``, `last`]
                    }]
                }],
                "align-self": [{
                    self: [`auto`, ...T(), {
                        baseline: [``, `last`]
                    }]
                }],
                "place-content": [{
                    "place-content": w()
                }],
                "place-items": [{
                    "place-items": [...T(), `baseline`]
                }],
                "place-self": [{
                    "place-self": [`auto`, ...T()]
                }],
                p: [{
                    p: x()
                }],
                px: [{
                    px: x()
                }],
                py: [{
                    py: x()
                }],
                ps: [{
                    ps: x()
                }],
                pe: [{
                    pe: x()
                }],
                pbs: [{
                    pbs: x()
                }],
                pbe: [{
                    pbe: x()
                }],
                pt: [{
                    pt: x()
                }],
                pr: [{
                    pr: x()
                }],
                pb: [{
                    pb: x()
                }],
                pl: [{
                    pl: x()
                }],
                m: [{
                    m: E()
                }],
                mx: [{
                    mx: E()
                }],
                my: [{
                    my: E()
                }],
                ms: [{
                    ms: E()
                }],
                me: [{
                    me: E()
                }],
                mbs: [{
                    mbs: E()
                }],
                mbe: [{
                    mbe: E()
                }],
                mt: [{
                    mt: E()
                }],
                mr: [{
                    mr: E()
                }],
                mb: [{
                    mb: E()
                }],
                ml: [{
                    ml: E()
                }],
                "space-x": [{
                    "space-x": x()
                }],
                "space-x-reverse": [`space-x-reverse`],
                "space-y": [{
                    "space-y": x()
                }],
                "space-y-reverse": [`space-y-reverse`],
                size: [{
                    size: D()
                }],
                "inline-size": [{
                    inline: [`auto`, ...O()]
                }],
                "min-inline-size": [{
                    "min-inline": [`auto`, ...O()]
                }],
                "max-inline-size": [{
                    "max-inline": [`none`, ...O()]
                }],
                "block-size": [{
                    block: [`auto`, ...A()]
                }],
                "min-block-size": [{
                    "min-block": [`auto`, ...A()]
                }],
                "max-block-size": [{
                    "max-block": [`none`, ...A()]
                }],
                w: [{
                    w: [s, `screen`, ...D()]
                }],
                "min-w": [{
                    "min-w": [s, `screen`, `none`, ...D()]
                }],
                "max-w": [{
                    "max-w": [s, `screen`, `none`, `prose`, {
                        screen: [o]
                    }, ...D()]
                }],
                h: [{
                    h: [`screen`, `lh`, ...D()]
                }],
                "min-h": [{
                    "min-h": [`screen`, `lh`, `none`, ...D()]
                }],
                "max-h": [{
                    "max-h": [`screen`, `lh`, ...D()]
                }],
                "font-size": [{
                    text: [`base`, n, K, U]
                }],
                "font-smoothing": [`antialiased`, `subpixel-antialiased`],
                "font-style": [`italic`, `not-italic`],
                "font-weight": [{
                    font: [r, Te, ge]
                }],
                "font-stretch": [{
                    "font-stretch": [`ultra-condensed`, `extra-condensed`, `condensed`, `semi-condensed`, `normal`, `semi-expanded`, `expanded`, `extra-expanded`, `ultra-expanded`, le, H]
                }],
                "font-family": [{
                    font: [be, _e, t]
                }],
                "font-features": [{
                    "font-features": [H]
                }],
                "fvn-normal": [`normal-nums`],
                "fvn-ordinal": [`ordinal`],
                "fvn-slashed-zero": [`slashed-zero`],
                "fvn-figure": [`lining-nums`, `oldstyle-nums`],
                "fvn-spacing": [`proportional-nums`, `tabular-nums`],
                "fvn-fraction": [`diagonal-fractions`, `stacked-fractions`],
                tracking: [{
                    tracking: [i, G, H]
                }],
                "line-clamp": [{
                    "line-clamp": [I, `none`, G, he]
                }],
                leading: [{
                    leading: [a, ...x()]
                }],
                "list-image": [{
                    "list-image": [`none`, G, H]
                }],
                "list-style-position": [{
                    list: [`inside`, `outside`]
                }],
                "list-style-type": [{
                    list: [`disc`, `decimal`, `none`, G, H]
                }],
                "text-alignment": [{
                    text: [`left`, `center`, `right`, `justify`, `start`, `end`]
                }],
                "placeholder-color": [{
                    placeholder: j()
                }],
                "text-color": [{
                    text: j()
                }],
                "text-decoration": [`underline`, `overline`, `line-through`, `no-underline`],
                "text-decoration-style": [{
                    decoration: [...z(), `wavy`]
                }],
                "text-decoration-thickness": [{
                    decoration: [I, `from-font`, `auto`, G, U]
                }],
                "text-decoration-color": [{
                    decoration: j()
                }],
                "underline-offset": [{
                    "underline-offset": [I, `auto`, G, H]
                }],
                "text-transform": [`uppercase`, `lowercase`, `capitalize`, `normal-case`],
                "text-overflow": [`truncate`, `text-ellipsis`, `text-clip`],
                "text-wrap": [{
                    text: [`wrap`, `nowrap`, `balance`, `pretty`]
                }],
                indent: [{
                    indent: x()
                }],
                "tab-size": [{
                    tab: [L, G, H]
                }],
                "vertical-align": [{
                    align: [`baseline`, `top`, `middle`, `bottom`, `text-top`, `text-bottom`, `sub`, `super`, G, H]
                }],
                whitespace: [{
                    whitespace: [`normal`, `nowrap`, `pre`, `pre-line`, `pre-wrap`, `break-spaces`]
                }],
                break: [{
                    break: [`normal`, `words`, `all`, `keep`]
                }],
                wrap: [{
                    wrap: [`break-word`, `anywhere`, `normal`]
                }],
                hyphens: [{
                    hyphens: [`none`, `manual`, `auto`]
                }],
                content: [{
                    content: [`none`, G, H]
                }],
                "bg-attachment": [{
                    bg: [`fixed`, `local`, `scroll`]
                }],
                "bg-clip": [{
                    "bg-clip": [`border`, `padding`, `content`, `text`]
                }],
                "bg-origin": [{
                    "bg-origin": [`border`, `padding`, `content`]
                }],
                "bg-position": [{
                    bg: oe()
                }],
                "bg-repeat": [{
                    bg: se()
                }],
                "bg-size": [{
                    bg: ce()
                }],
                "bg-image": [{
                    bg: [`none`, {
                        linear: [{
                            to: [`t`, `tr`, `r`, `br`, `b`, `bl`, `l`, `tl`]
                        }, L, G, H],
                        radial: [``, G, H],
                        conic: [L, G, H]
                    }, Ce, ye]
                }],
                "bg-color": [{
                    bg: j()
                }],
                "gradient-from-pos": [{
                    from: M()
                }],
                "gradient-via-pos": [{
                    via: M()
                }],
                "gradient-to-pos": [{
                    to: M()
                }],
                "gradient-from": [{
                    from: j()
                }],
                "gradient-via": [{
                    via: j()
                }],
                "gradient-to": [{
                    to: j()
                }],
                rounded: [{
                    rounded: N()
                }],
                "rounded-s": [{
                    "rounded-s": N()
                }],
                "rounded-e": [{
                    "rounded-e": N()
                }],
                "rounded-t": [{
                    "rounded-t": N()
                }],
                "rounded-r": [{
                    "rounded-r": N()
                }],
                "rounded-b": [{
                    "rounded-b": N()
                }],
                "rounded-l": [{
                    "rounded-l": N()
                }],
                "rounded-ss": [{
                    "rounded-ss": N()
                }],
                "rounded-se": [{
                    "rounded-se": N()
                }],
                "rounded-ee": [{
                    "rounded-ee": N()
                }],
                "rounded-es": [{
                    "rounded-es": N()
                }],
                "rounded-tl": [{
                    "rounded-tl": N()
                }],
                "rounded-tr": [{
                    "rounded-tr": N()
                }],
                "rounded-br": [{
                    "rounded-br": N()
                }],
                "rounded-bl": [{
                    "rounded-bl": N()
                }],
                "border-w": [{
                    border: P()
                }],
                "border-w-x": [{
                    "border-x": P()
                }],
                "border-w-y": [{
                    "border-y": P()
                }],
                "border-w-s": [{
                    "border-s": P()
                }],
                "border-w-e": [{
                    "border-e": P()
                }],
                "border-w-bs": [{
                    "border-bs": P()
                }],
                "border-w-be": [{
                    "border-be": P()
                }],
                "border-w-t": [{
                    "border-t": P()
                }],
                "border-w-r": [{
                    "border-r": P()
                }],
                "border-w-b": [{
                    "border-b": P()
                }],
                "border-w-l": [{
                    "border-l": P()
                }],
                "divide-x": [{
                    "divide-x": P()
                }],
                "divide-x-reverse": [`divide-x-reverse`],
                "divide-y": [{
                    "divide-y": P()
                }],
                "divide-y-reverse": [`divide-y-reverse`],
                "border-style": [{
                    border: [...z(), `hidden`, `none`]
                }],
                "divide-style": [{
                    divide: [...z(), `hidden`, `none`]
                }],
                "border-color": [{
                    border: j()
                }],
                "border-color-x": [{
                    "border-x": j()
                }],
                "border-color-y": [{
                    "border-y": j()
                }],
                "border-color-s": [{
                    "border-s": j()
                }],
                "border-color-e": [{
                    "border-e": j()
                }],
                "border-color-bs": [{
                    "border-bs": j()
                }],
                "border-color-be": [{
                    "border-be": j()
                }],
                "border-color-t": [{
                    "border-t": j()
                }],
                "border-color-r": [{
                    "border-r": j()
                }],
                "border-color-b": [{
                    "border-b": j()
                }],
                "border-color-l": [{
                    "border-l": j()
                }],
                "divide-color": [{
                    divide: j()
                }],
                "outline-style": [{
                    outline: [...z(), `none`, `hidden`]
                }],
                "outline-offset": [{
                    "outline-offset": [I, G, H]
                }],
                "outline-w": [{
                    outline: [``, I, K, U]
                }],
                "outline-color": [{
                    outline: j()
                }],
                shadow: [{
                    shadow: [``, `none`, ee, we, W]
                }],
                "shadow-color": [{
                    shadow: j()
                }],
                "inset-shadow": [{
                    "inset-shadow": [`none`, u, we, W]
                }],
                "inset-shadow-color": [{
                    "inset-shadow": j()
                }],
                "ring-w": [{
                    ring: P()
                }],
                "ring-w-inset": [`ring-inset`],
                "ring-color": [{
                    ring: j()
                }],
                "ring-offset-w": [{
                    "ring-offset": [I, U]
                }],
                "ring-offset-color": [{
                    "ring-offset": j()
                }],
                "inset-ring-w": [{
                    "inset-ring": P()
                }],
                "inset-ring-color": [{
                    "inset-ring": j()
                }],
                "text-shadow": [{
                    "text-shadow": [`none`, te, we, W]
                }],
                "text-shadow-color": [{
                    "text-shadow": j()
                }],
                opacity: [{
                    opacity: [I, G, H]
                }],
                "mix-blend": [{
                    "mix-blend": [...B(), `plus-darker`, `plus-lighter`]
                }],
                "bg-blend": [{
                    "bg-blend": B()
                }],
                "mask-clip": [{
                    "mask-clip": [`border`, `padding`, `content`, `fill`, `stroke`, `view`]
                }, `mask-no-clip`],
                "mask-composite": [{
                    mask: [`add`, `subtract`, `intersect`, `exclude`]
                }],
                "mask-image-linear-pos": [{
                    "mask-linear": [I]
                }],
                "mask-image-linear-from-pos": [{
                    "mask-linear-from": V()
                }],
                "mask-image-linear-to-pos": [{
                    "mask-linear-to": V()
                }],
                "mask-image-linear-from-color": [{
                    "mask-linear-from": j()
                }],
                "mask-image-linear-to-color": [{
                    "mask-linear-to": j()
                }],
                "mask-image-t-from-pos": [{
                    "mask-t-from": V()
                }],
                "mask-image-t-to-pos": [{
                    "mask-t-to": V()
                }],
                "mask-image-t-from-color": [{
                    "mask-t-from": j()
                }],
                "mask-image-t-to-color": [{
                    "mask-t-to": j()
                }],
                "mask-image-r-from-pos": [{
                    "mask-r-from": V()
                }],
                "mask-image-r-to-pos": [{
                    "mask-r-to": V()
                }],
                "mask-image-r-from-color": [{
                    "mask-r-from": j()
                }],
                "mask-image-r-to-color": [{
                    "mask-r-to": j()
                }],
                "mask-image-b-from-pos": [{
                    "mask-b-from": V()
                }],
                "mask-image-b-to-pos": [{
                    "mask-b-to": V()
                }],
                "mask-image-b-from-color": [{
                    "mask-b-from": j()
                }],
                "mask-image-b-to-color": [{
                    "mask-b-to": j()
                }],
                "mask-image-l-from-pos": [{
                    "mask-l-from": V()
                }],
                "mask-image-l-to-pos": [{
                    "mask-l-to": V()
                }],
                "mask-image-l-from-color": [{
                    "mask-l-from": j()
                }],
                "mask-image-l-to-color": [{
                    "mask-l-to": j()
                }],
                "mask-image-x-from-pos": [{
                    "mask-x-from": V()
                }],
                "mask-image-x-to-pos": [{
                    "mask-x-to": V()
                }],
                "mask-image-x-from-color": [{
                    "mask-x-from": j()
                }],
                "mask-image-x-to-color": [{
                    "mask-x-to": j()
                }],
                "mask-image-y-from-pos": [{
                    "mask-y-from": V()
                }],
                "mask-image-y-to-pos": [{
                    "mask-y-to": V()
                }],
                "mask-image-y-from-color": [{
                    "mask-y-from": j()
                }],
                "mask-image-y-to-color": [{
                    "mask-y-to": j()
                }],
                "mask-image-radial": [{
                    "mask-radial": [G, H]
                }],
                "mask-image-radial-from-pos": [{
                    "mask-radial-from": V()
                }],
                "mask-image-radial-to-pos": [{
                    "mask-radial-to": V()
                }],
                "mask-image-radial-from-color": [{
                    "mask-radial-from": j()
                }],
                "mask-image-radial-to-color": [{
                    "mask-radial-to": j()
                }],
                "mask-image-radial-shape": [{
                    "mask-radial": [`circle`, `ellipse`]
                }],
                "mask-image-radial-size": [{
                    "mask-radial": [{
                        closest: [`side`, `corner`],
                        farthest: [`side`, `corner`]
                    }]
                }],
                "mask-image-radial-pos": [{
                    "mask-radial-at": v()
                }],
                "mask-image-conic-pos": [{
                    "mask-conic": [I]
                }],
                "mask-image-conic-from-pos": [{
                    "mask-conic-from": V()
                }],
                "mask-image-conic-to-pos": [{
                    "mask-conic-to": V()
                }],
                "mask-image-conic-from-color": [{
                    "mask-conic-from": j()
                }],
                "mask-image-conic-to-color": [{
                    "mask-conic-to": j()
                }],
                "mask-mode": [{
                    mask: [`alpha`, `luminance`, `match`]
                }],
                "mask-origin": [{
                    "mask-origin": [`border`, `padding`, `content`, `fill`, `stroke`, `view`]
                }],
                "mask-position": [{
                    mask: oe()
                }],
                "mask-repeat": [{
                    mask: se()
                }],
                "mask-size": [{
                    mask: ce()
                }],
                "mask-type": [{
                    "mask-type": [`alpha`, `luminance`]
                }],
                "mask-image": [{
                    mask: [`none`, G, H]
                }],
                filter: [{
                    filter: [``, `none`, G, H]
                }],
                blur: [{
                    blur: de()
                }],
                brightness: [{
                    brightness: [I, G, H]
                }],
                contrast: [{
                    contrast: [I, G, H]
                }],
                "drop-shadow": [{
                    "drop-shadow": [``, `none`, d, we, W]
                }],
                "drop-shadow-color": [{
                    "drop-shadow": j()
                }],
                grayscale: [{
                    grayscale: [``, I, G, H]
                }],
                "hue-rotate": [{
                    "hue-rotate": [I, G, H]
                }],
                invert: [{
                    invert: [``, I, G, H]
                }],
                saturate: [{
                    saturate: [I, G, H]
                }],
                sepia: [{
                    sepia: [``, I, G, H]
                }],
                "backdrop-filter": [{
                    "backdrop-filter": [``, `none`, G, H]
                }],
                "backdrop-blur": [{
                    "backdrop-blur": de()
                }],
                "backdrop-brightness": [{
                    "backdrop-brightness": [I, G, H]
                }],
                "backdrop-contrast": [{
                    "backdrop-contrast": [I, G, H]
                }],
                "backdrop-grayscale": [{
                    "backdrop-grayscale": [``, I, G, H]
                }],
                "backdrop-hue-rotate": [{
                    "backdrop-hue-rotate": [I, G, H]
                }],
                "backdrop-invert": [{
                    "backdrop-invert": [``, I, G, H]
                }],
                "backdrop-opacity": [{
                    "backdrop-opacity": [I, G, H]
                }],
                "backdrop-saturate": [{
                    "backdrop-saturate": [I, G, H]
                }],
                "backdrop-sepia": [{
                    "backdrop-sepia": [``, I, G, H]
                }],
                "border-collapse": [{
                    border: [`collapse`, `separate`]
                }],
                "border-spacing": [{
                    "border-spacing": x()
                }],
                "border-spacing-x": [{
                    "border-spacing-x": x()
                }],
                "border-spacing-y": [{
                    "border-spacing-y": x()
                }],
                "table-layout": [{
                    table: [`auto`, `fixed`]
                }],
                caption: [{
                    caption: [`top`, `bottom`]
                }],
                transition: [{
                    transition: [``, `all`, `colors`, `opacity`, `shadow`, `transform`, `none`, G, H]
                }],
                "transition-behavior": [{
                    transition: [`normal`, `discrete`]
                }],
                duration: [{
                    duration: [I, `initial`, G, H]
                }],
                ease: [{
                    ease: [`linear`, `initial`, h, G, H]
                }],
                delay: [{
                    delay: [I, G, H]
                }],
                animate: [{
                    animate: [`none`, g, G, H]
                }],
                backface: [{
                    backface: [`hidden`, `visible`]
                }],
                perspective: [{
                    perspective: [p, G, H]
                }],
                "perspective-origin": [{
                    "perspective-origin": y()
                }],
                rotate: [{
                    rotate: q()
                }],
                "rotate-x": [{
                    "rotate-x": q()
                }],
                "rotate-y": [{
                    "rotate-y": q()
                }],
                "rotate-z": [{
                    "rotate-z": q()
                }],
                scale: [{
                    scale: J()
                }],
                "scale-x": [{
                    "scale-x": J()
                }],
                "scale-y": [{
                    "scale-y": J()
                }],
                "scale-z": [{
                    "scale-z": J()
                }],
                "scale-3d": [`scale-3d`],
                skew: [{
                    skew: Y()
                }],
                "skew-x": [{
                    "skew-x": Y()
                }],
                "skew-y": [{
                    "skew-y": Y()
                }],
                transform: [{
                    transform: [G, H, ``, `none`, `gpu`, `cpu`]
                }],
                "transform-origin": [{
                    origin: y()
                }],
                "transform-style": [{
                    transform: [`3d`, `flat`]
                }],
                translate: [{
                    translate: X()
                }],
                "translate-x": [{
                    "translate-x": X()
                }],
                "translate-y": [{
                    "translate-y": X()
                }],
                "translate-z": [{
                    "translate-z": X()
                }],
                "translate-none": [`translate-none`],
                zoom: [{
                    zoom: [L, G, H]
                }],
                accent: [{
                    accent: j()
                }],
                appearance: [{
                    appearance: [`none`, `auto`]
                }],
                "caret-color": [{
                    caret: j()
                }],
                "color-scheme": [{
                    scheme: [`normal`, `dark`, `light`, `light-dark`, `only-dark`, `only-light`]
                }],
                cursor: [{
                    cursor: [`auto`, `default`, `pointer`, `wait`, `text`, `move`, `help`, `not-allowed`, `none`, `context-menu`, `progress`, `cell`, `crosshair`, `vertical-text`, `alias`, `copy`, `no-drop`, `grab`, `grabbing`, `all-scroll`, `col-resize`, `row-resize`, `n-resize`, `e-resize`, `s-resize`, `w-resize`, `ne-resize`, `nw-resize`, `se-resize`, `sw-resize`, `ew-resize`, `ns-resize`, `nesw-resize`, `nwse-resize`, `zoom-in`, `zoom-out`, G, H]
                }],
                "field-sizing": [{
                    "field-sizing": [`fixed`, `content`]
                }],
                "pointer-events": [{
                    "pointer-events": [`auto`, `none`]
                }],
                resize: [{
                    resize: [`none`, ``, `y`, `x`]
                }],
                "scroll-behavior": [{
                    scroll: [`auto`, `smooth`]
                }],
                "scrollbar-thumb-color": [{
                    "scrollbar-thumb": j()
                }],
                "scrollbar-track-color": [{
                    "scrollbar-track": j()
                }],
                "scrollbar-gutter": [{
                    "scrollbar-gutter": [`auto`, `stable`, `both`]
                }],
                "scrollbar-w": [{
                    scrollbar: [`auto`, `thin`, `none`]
                }],
                "scroll-m": [{
                    "scroll-m": x()
                }],
                "scroll-mx": [{
                    "scroll-mx": x()
                }],
                "scroll-my": [{
                    "scroll-my": x()
                }],
                "scroll-ms": [{
                    "scroll-ms": x()
                }],
                "scroll-me": [{
                    "scroll-me": x()
                }],
                "scroll-mbs": [{
                    "scroll-mbs": x()
                }],
                "scroll-mbe": [{
                    "scroll-mbe": x()
                }],
                "scroll-mt": [{
                    "scroll-mt": x()
                }],
                "scroll-mr": [{
                    "scroll-mr": x()
                }],
                "scroll-mb": [{
                    "scroll-mb": x()
                }],
                "scroll-ml": [{
                    "scroll-ml": x()
                }],
                "scroll-p": [{
                    "scroll-p": x()
                }],
                "scroll-px": [{
                    "scroll-px": x()
                }],
                "scroll-py": [{
                    "scroll-py": x()
                }],
                "scroll-ps": [{
                    "scroll-ps": x()
                }],
                "scroll-pe": [{
                    "scroll-pe": x()
                }],
                "scroll-pbs": [{
                    "scroll-pbs": x()
                }],
                "scroll-pbe": [{
                    "scroll-pbe": x()
                }],
                "scroll-pt": [{
                    "scroll-pt": x()
                }],
                "scroll-pr": [{
                    "scroll-pr": x()
                }],
                "scroll-pb": [{
                    "scroll-pb": x()
                }],
                "scroll-pl": [{
                    "scroll-pl": x()
                }],
                "snap-align": [{
                    snap: [`start`, `end`, `center`, `align-none`]
                }],
                "snap-stop": [{
                    snap: [`normal`, `always`]
                }],
                "snap-type": [{
                    snap: [`none`, `x`, `y`, `both`]
                }],
                "snap-strictness": [{
                    snap: [`mandatory`, `proximity`]
                }],
                touch: [{
                    touch: [`auto`, `none`, `manipulation`]
                }],
                "touch-x": [{
                    "touch-pan": [`x`, `left`, `right`]
                }],
                "touch-y": [{
                    "touch-pan": [`y`, `up`, `down`]
                }],
                "touch-pz": [`touch-pinch-zoom`],
                select: [{
                    select: [`none`, `text`, `all`, `auto`]
                }],
                "will-change": [{
                    "will-change": [`auto`, `scroll`, `contents`, `transform`, G, H]
                }],
                fill: [{
                    fill: [`none`, ...j()]
                }],
                "stroke-w": [{
                    stroke: [I, K, U, he]
                }],
                stroke: [{
                    stroke: [`none`, ...j()]
                }],
                "forced-color-adjust": [{
                    "forced-color-adjust": [`auto`, `none`]
                }]
            },
            conflictingClassGroups: {
                "container-named": [`container-type`],
                overflow: [`overflow-x`, `overflow-y`],
                overscroll: [`overscroll-x`, `overscroll-y`],
                inset: [`inset-x`, `inset-y`, `inset-bs`, `inset-be`, `start`, `end`, `top`, `right`, `bottom`, `left`],
                "inset-x": [`right`, `left`],
                "inset-y": [`top`, `bottom`],
                flex: [`basis`, `grow`, `shrink`],
                gap: [`gap-x`, `gap-y`],
                p: [`px`, `py`, `ps`, `pe`, `pbs`, `pbe`, `pt`, `pr`, `pb`, `pl`],
                px: [`pr`, `pl`],
                py: [`pt`, `pb`],
                m: [`mx`, `my`, `ms`, `me`, `mbs`, `mbe`, `mt`, `mr`, `mb`, `ml`],
                mx: [`mr`, `ml`],
                my: [`mt`, `mb`],
                size: [`w`, `h`],
                "font-size": [`leading`],
                "fvn-normal": [`fvn-ordinal`, `fvn-slashed-zero`, `fvn-figure`, `fvn-spacing`, `fvn-fraction`],
                "fvn-ordinal": [`fvn-normal`],
                "fvn-slashed-zero": [`fvn-normal`],
                "fvn-figure": [`fvn-normal`],
                "fvn-spacing": [`fvn-normal`],
                "fvn-fraction": [`fvn-normal`],
                "line-clamp": [`display`, `overflow`],
                rounded: [`rounded-s`, `rounded-e`, `rounded-t`, `rounded-r`, `rounded-b`, `rounded-l`, `rounded-ss`, `rounded-se`, `rounded-ee`, `rounded-es`, `rounded-tl`, `rounded-tr`, `rounded-br`, `rounded-bl`],
                "rounded-s": [`rounded-ss`, `rounded-es`],
                "rounded-e": [`rounded-se`, `rounded-ee`],
                "rounded-t": [`rounded-tl`, `rounded-tr`],
                "rounded-r": [`rounded-tr`, `rounded-br`],
                "rounded-b": [`rounded-br`, `rounded-bl`],
                "rounded-l": [`rounded-tl`, `rounded-bl`],
                "border-spacing": [`border-spacing-x`, `border-spacing-y`],
                "border-w": [`border-w-x`, `border-w-y`, `border-w-s`, `border-w-e`, `border-w-bs`, `border-w-be`, `border-w-t`, `border-w-r`, `border-w-b`, `border-w-l`],
                "border-w-x": [`border-w-r`, `border-w-l`],
                "border-w-y": [`border-w-t`, `border-w-b`],
                "border-color": [`border-color-x`, `border-color-y`, `border-color-s`, `border-color-e`, `border-color-bs`, `border-color-be`, `border-color-t`, `border-color-r`, `border-color-b`, `border-color-l`],
                "border-color-x": [`border-color-r`, `border-color-l`],
                "border-color-y": [`border-color-t`, `border-color-b`],
                translate: [`translate-x`, `translate-y`, `translate-none`],
                "translate-none": [`translate`, `translate-x`, `translate-y`, `translate-z`],
                "scroll-m": [`scroll-mx`, `scroll-my`, `scroll-ms`, `scroll-me`, `scroll-mbs`, `scroll-mbe`, `scroll-mt`, `scroll-mr`, `scroll-mb`, `scroll-ml`],
                "scroll-mx": [`scroll-mr`, `scroll-ml`],
                "scroll-my": [`scroll-mt`, `scroll-mb`],
                "scroll-p": [`scroll-px`, `scroll-py`, `scroll-ps`, `scroll-pe`, `scroll-pbs`, `scroll-pbe`, `scroll-pt`, `scroll-pr`, `scroll-pb`, `scroll-pl`],
                "scroll-px": [`scroll-pr`, `scroll-pl`],
                "scroll-py": [`scroll-pt`, `scroll-pb`],
                touch: [`touch-x`, `touch-y`, `touch-pz`],
                "touch-x": [`touch`],
                "touch-y": [`touch`],
                "touch-pz": [`touch`]
            },
            conflictingClassGroupModifiers: {
                "font-size": [`leading`]
            },
            postfixLookupClassGroups: [`container-type`],
            orderSensitiveModifiers: [`*`, `**`, `after`, `backdrop`, `before`, `details-content`, `file`, `first-letter`, `first-line`, `marker`, `placeholder`, `selection`]
        }
    },
    Ne = (e, {
        cacheSize: t,
        prefix: n,
        experimentalParseClassName: r,
        extend: i = {},
        override: a = {}
    }) => (Z(e, `cacheSize`, t), Z(e, `prefix`, n), Z(e, `experimentalParseClassName`, r), Pe(e.theme, a.theme), Pe(e.classGroups, a.classGroups), Pe(e.conflictingClassGroups, a.conflictingClassGroups), Pe(e.conflictingClassGroupModifiers, a.conflictingClassGroupModifiers), Z(e, `postfixLookupClassGroups`, a.postfixLookupClassGroups), Z(e, `orderSensitiveModifiers`, a.orderSensitiveModifiers), Fe(e.theme, i.theme), Fe(e.classGroups, i.classGroups), Fe(e.conflictingClassGroups, i.conflictingClassGroups), Fe(e.conflictingClassGroupModifiers, i.conflictingClassGroupModifiers), Ie(e, i, `postfixLookupClassGroups`), Ie(e, i, `orderSensitiveModifiers`), e),
    Z = (e, t, n) => {
        n !== void 0 && (e[t] = n)
    },
    Pe = (e, t) => {
        if (t)
            for (let n in t) Z(e, n, t[n])
    },
    Fe = (e, t) => {
        if (t)
            for (let n in t) Ie(e, t, n)
    },
    Ie = (e, t, n) => {
        let r = t[n];
        r !== void 0 && (e[n] = e[n] ? e[n].concat(r) : r)
    },
    Le = (e, ...t) => typeof e == `function` ? D(Me, e, ...t) : D(() => Ne(Me(), e), ...t),
    Re = {
        families: {
            TYPE_SCALE: [`caption`, `footnote`, `code`, `body`, `heading`, `title`],
            TYPE_WEIGHTS: {
                medium: 500,
                semibold: 600,
                bold: 700
            }
        },
        themeExtend: JSON.parse(`{"colors":{"black":"var(--cds-black)","clay":{"DEFAULT":"var(--cds-clay)","emphasized":"var(--cds-clay-emphasized)"},"heather":{"DEFAULT":"var(--cds-heather)"},"plum":{"DEFAULT":"var(--cds-plum)"},"cactus":{"DEFAULT":"var(--cds-cactus)"},"mineral":{"DEFAULT":"var(--cds-mineral)"},"peach":{"DEFAULT":"var(--cds-peach)"},"gray":{"0":"var(--cds-gray-0)","10":"var(--cds-gray-10)","20":"var(--cds-gray-20)","30":"var(--cds-gray-30)","40":"var(--cds-gray-40)","50":"var(--cds-gray-50)","60":"var(--cds-gray-60)","70":"var(--cds-gray-70)","80":"var(--cds-gray-80)","90":"var(--cds-gray-90)","100":"var(--cds-gray-100)","150":"var(--cds-gray-150)","200":"var(--cds-gray-200)","250":"var(--cds-gray-250)","300":"var(--cds-gray-300)","350":"var(--cds-gray-350)","400":"var(--cds-gray-400)","450":"var(--cds-gray-450)","500":"var(--cds-gray-500)","550":"var(--cds-gray-550)","600":"var(--cds-gray-600)","650":"var(--cds-gray-650)","700":"var(--cds-gray-700)","750":"var(--cds-gray-750)","800":"var(--cds-gray-800)","810":"var(--cds-gray-810)","820":"var(--cds-gray-820)","830":"var(--cds-gray-830)","840":"var(--cds-gray-840)","850":"var(--cds-gray-850)","860":"var(--cds-gray-860)","870":"var(--cds-gray-870)","880":"var(--cds-gray-880)","890":"var(--cds-gray-890)","900":"var(--cds-gray-900)"},"red":{"0":"var(--cds-red-0)","10":"var(--cds-red-10)","20":"var(--cds-red-20)","30":"var(--cds-red-30)","40":"var(--cds-red-40)","50":"var(--cds-red-50)","60":"var(--cds-red-60)","70":"var(--cds-red-70)","80":"var(--cds-red-80)","90":"var(--cds-red-90)","100":"var(--cds-red-100)","150":"var(--cds-red-150)","200":"var(--cds-red-200)","250":"var(--cds-red-250)","300":"var(--cds-red-300)","350":"var(--cds-red-350)","400":"var(--cds-red-400)","450":"var(--cds-red-450)","500":"var(--cds-red-500)","550":"var(--cds-red-550)","600":"var(--cds-red-600)","650":"var(--cds-red-650)","700":"var(--cds-red-700)","750":"var(--cds-red-750)","800":"var(--cds-red-800)","810":"var(--cds-red-810)","820":"var(--cds-red-820)","830":"var(--cds-red-830)","840":"var(--cds-red-840)","850":"var(--cds-red-850)","860":"var(--cds-red-860)","870":"var(--cds-red-870)","880":"var(--cds-red-880)","890":"var(--cds-red-890)","900":"var(--cds-red-900)"},"orange":{"0":"var(--cds-orange-0)","10":"var(--cds-orange-10)","20":"var(--cds-orange-20)","30":"var(--cds-orange-30)","40":"var(--cds-orange-40)","50":"var(--cds-orange-50)","60":"var(--cds-orange-60)","70":"var(--cds-orange-70)","80":"var(--cds-orange-80)","90":"var(--cds-orange-90)","100":"var(--cds-orange-100)","150":"var(--cds-orange-150)","200":"var(--cds-orange-200)","250":"var(--cds-orange-250)","300":"var(--cds-orange-300)","350":"var(--cds-orange-350)","400":"var(--cds-orange-400)","450":"var(--cds-orange-450)","500":"var(--cds-orange-500)","550":"var(--cds-orange-550)","600":"var(--cds-orange-600)","650":"var(--cds-orange-650)","700":"var(--cds-orange-700)","750":"var(--cds-orange-750)","800":"var(--cds-orange-800)","810":"var(--cds-orange-810)","820":"var(--cds-orange-820)","830":"var(--cds-orange-830)","840":"var(--cds-orange-840)","850":"var(--cds-orange-850)","860":"var(--cds-orange-860)","870":"var(--cds-orange-870)","880":"var(--cds-orange-880)","890":"var(--cds-orange-890)","900":"var(--cds-orange-900)"},"yellow":{"0":"var(--cds-yellow-0)","10":"var(--cds-yellow-10)","20":"var(--cds-yellow-20)","30":"var(--cds-yellow-30)","40":"var(--cds-yellow-40)","50":"var(--cds-yellow-50)","60":"var(--cds-yellow-60)","70":"var(--cds-yellow-70)","80":"var(--cds-yellow-80)","90":"var(--cds-yellow-90)","100":"var(--cds-yellow-100)","150":"var(--cds-yellow-150)","200":"var(--cds-yellow-200)","250":"var(--cds-yellow-250)","300":"var(--cds-yellow-300)","350":"var(--cds-yellow-350)","400":"var(--cds-yellow-400)","450":"var(--cds-yellow-450)","500":"var(--cds-yellow-500)","550":"var(--cds-yellow-550)","600":"var(--cds-yellow-600)","650":"var(--cds-yellow-650)","700":"var(--cds-yellow-700)","750":"var(--cds-yellow-750)","800":"var(--cds-yellow-800)","810":"var(--cds-yellow-810)","820":"var(--cds-yellow-820)","830":"var(--cds-yellow-830)","840":"var(--cds-yellow-840)","850":"var(--cds-yellow-850)","860":"var(--cds-yellow-860)","870":"var(--cds-yellow-870)","880":"var(--cds-yellow-880)","890":"var(--cds-yellow-890)","900":"var(--cds-yellow-900)"},"green":{"0":"var(--cds-green-0)","10":"var(--cds-green-10)","20":"var(--cds-green-20)","30":"var(--cds-green-30)","40":"var(--cds-green-40)","50":"var(--cds-green-50)","60":"var(--cds-green-60)","70":"var(--cds-green-70)","80":"var(--cds-green-80)","90":"var(--cds-green-90)","100":"var(--cds-green-100)","150":"var(--cds-green-150)","200":"var(--cds-green-200)","250":"var(--cds-green-250)","300":"var(--cds-green-300)","350":"var(--cds-green-350)","400":"var(--cds-green-400)","450":"var(--cds-green-450)","500":"var(--cds-green-500)","550":"var(--cds-green-550)","600":"var(--cds-green-600)","650":"var(--cds-green-650)","700":"var(--cds-green-700)","750":"var(--cds-green-750)","800":"var(--cds-green-800)","810":"var(--cds-green-810)","820":"var(--cds-green-820)","830":"var(--cds-green-830)","840":"var(--cds-green-840)","850":"var(--cds-green-850)","860":"var(--cds-green-860)","870":"var(--cds-green-870)","880":"var(--cds-green-880)","890":"var(--cds-green-890)","900":"var(--cds-green-900)"},"aqua":{"0":"var(--cds-aqua-0)","10":"var(--cds-aqua-10)","20":"var(--cds-aqua-20)","30":"var(--cds-aqua-30)","40":"var(--cds-aqua-40)","50":"var(--cds-aqua-50)","60":"var(--cds-aqua-60)","70":"var(--cds-aqua-70)","80":"var(--cds-aqua-80)","90":"var(--cds-aqua-90)","100":"var(--cds-aqua-100)","150":"var(--cds-aqua-150)","200":"var(--cds-aqua-200)","250":"var(--cds-aqua-250)","300":"var(--cds-aqua-300)","350":"var(--cds-aqua-350)","400":"var(--cds-aqua-400)","450":"var(--cds-aqua-450)","500":"var(--cds-aqua-500)","550":"var(--cds-aqua-550)","600":"var(--cds-aqua-600)","650":"var(--cds-aqua-650)","700":"var(--cds-aqua-700)","750":"var(--cds-aqua-750)","800":"var(--cds-aqua-800)","810":"var(--cds-aqua-810)","820":"var(--cds-aqua-820)","830":"var(--cds-aqua-830)","840":"var(--cds-aqua-840)","850":"var(--cds-aqua-850)","860":"var(--cds-aqua-860)","870":"var(--cds-aqua-870)","880":"var(--cds-aqua-880)","890":"var(--cds-aqua-890)","900":"var(--cds-aqua-900)"},"blue":{"0":"var(--cds-blue-0)","10":"var(--cds-blue-10)","20":"var(--cds-blue-20)","30":"var(--cds-blue-30)","40":"var(--cds-blue-40)","50":"var(--cds-blue-50)","60":"var(--cds-blue-60)","70":"var(--cds-blue-70)","80":"var(--cds-blue-80)","90":"var(--cds-blue-90)","100":"var(--cds-blue-100)","150":"var(--cds-blue-150)","200":"var(--cds-blue-200)","250":"var(--cds-blue-250)","300":"var(--cds-blue-300)","350":"var(--cds-blue-350)","400":"var(--cds-blue-400)","450":"var(--cds-blue-450)","500":"var(--cds-blue-500)","550":"var(--cds-blue-550)","600":"var(--cds-blue-600)","650":"var(--cds-blue-650)","700":"var(--cds-blue-700)","750":"var(--cds-blue-750)","800":"var(--cds-blue-800)","810":"var(--cds-blue-810)","820":"var(--cds-blue-820)","830":"var(--cds-blue-830)","840":"var(--cds-blue-840)","850":"var(--cds-blue-850)","860":"var(--cds-blue-860)","870":"var(--cds-blue-870)","880":"var(--cds-blue-880)","890":"var(--cds-blue-890)","900":"var(--cds-blue-900)"},"violet":{"0":"var(--cds-violet-0)","10":"var(--cds-violet-10)","20":"var(--cds-violet-20)","30":"var(--cds-violet-30)","40":"var(--cds-violet-40)","50":"var(--cds-violet-50)","60":"var(--cds-violet-60)","70":"var(--cds-violet-70)","80":"var(--cds-violet-80)","90":"var(--cds-violet-90)","100":"var(--cds-violet-100)","150":"var(--cds-violet-150)","200":"var(--cds-violet-200)","250":"var(--cds-violet-250)","300":"var(--cds-violet-300)","350":"var(--cds-violet-350)","400":"var(--cds-violet-400)","450":"var(--cds-violet-450)","500":"var(--cds-violet-500)","550":"var(--cds-violet-550)","600":"var(--cds-violet-600)","650":"var(--cds-violet-650)","700":"var(--cds-violet-700)","750":"var(--cds-violet-750)","800":"var(--cds-violet-800)","810":"var(--cds-violet-810)","820":"var(--cds-violet-820)","830":"var(--cds-violet-830)","840":"var(--cds-violet-840)","850":"var(--cds-violet-850)","860":"var(--cds-violet-860)","870":"var(--cds-violet-870)","880":"var(--cds-violet-880)","890":"var(--cds-violet-890)","900":"var(--cds-violet-900)"},"magenta":{"0":"var(--cds-magenta-0)","10":"var(--cds-magenta-10)","20":"var(--cds-magenta-20)","30":"var(--cds-magenta-30)","40":"var(--cds-magenta-40)","50":"var(--cds-magenta-50)","60":"var(--cds-magenta-60)","70":"var(--cds-magenta-70)","80":"var(--cds-magenta-80)","90":"var(--cds-magenta-90)","100":"var(--cds-magenta-100)","150":"var(--cds-magenta-150)","200":"var(--cds-magenta-200)","250":"var(--cds-magenta-250)","300":"var(--cds-magenta-300)","350":"var(--cds-magenta-350)","400":"var(--cds-magenta-400)","450":"var(--cds-magenta-450)","500":"var(--cds-magenta-500)","550":"var(--cds-magenta-550)","600":"var(--cds-magenta-600)","650":"var(--cds-magenta-650)","700":"var(--cds-magenta-700)","750":"var(--cds-magenta-750)","800":"var(--cds-magenta-800)","810":"var(--cds-magenta-810)","820":"var(--cds-magenta-820)","830":"var(--cds-magenta-830)","840":"var(--cds-magenta-840)","850":"var(--cds-magenta-850)","860":"var(--cds-magenta-860)","870":"var(--cds-magenta-870)","880":"var(--cds-magenta-880)","890":"var(--cds-magenta-890)","900":"var(--cds-magenta-900)"},"pictogram-highlight":{"default":"var(--cds-pictogram-highlight-default)","heather":"var(--cds-pictogram-highlight-heather)","cactus":"var(--cds-pictogram-highlight-cactus)","peach":"var(--cds-pictogram-highlight-peach)"},"neutral":{"0":"var(--cds-neutral-0)","10":"var(--cds-neutral-10)","20":"var(--cds-neutral-20)","30":"var(--cds-neutral-30)","40":"var(--cds-neutral-40)","50":"var(--cds-neutral-50)","60":"var(--cds-neutral-60)","70":"var(--cds-neutral-70)","80":"var(--cds-neutral-80)","90":"var(--cds-neutral-90)","100":"var(--cds-neutral-100)","150":"var(--cds-neutral-150)","200":"var(--cds-neutral-200)","250":"var(--cds-neutral-250)","300":"var(--cds-neutral-300)","350":"var(--cds-neutral-350)","400":"var(--cds-neutral-400)","450":"var(--cds-neutral-450)","500":"var(--cds-neutral-500)","550":"var(--cds-neutral-550)","600":"var(--cds-neutral-600)","650":"var(--cds-neutral-650)","700":"var(--cds-neutral-700)","750":"var(--cds-neutral-750)","800":"var(--cds-neutral-800)","810":"var(--cds-neutral-810)","820":"var(--cds-neutral-820)","830":"var(--cds-neutral-830)","840":"var(--cds-neutral-840)","850":"var(--cds-neutral-850)","860":"var(--cds-neutral-860)","870":"var(--cds-neutral-870)","880":"var(--cds-neutral-880)","890":"var(--cds-neutral-890)","900":"var(--cds-neutral-900)"}},"backgroundColor":{"border":"var(--cds-border)","alpha-0":"var(--cds-alpha-0)","alpha-1":"var(--cds-alpha-1)","alpha-2":"var(--cds-alpha-2)","alpha-3":"var(--cds-alpha-3)","alpha-4":"var(--cds-alpha-4)","alpha-5":"var(--cds-alpha-5)","alpha-6":"var(--cds-alpha-6)","alpha-7":"var(--cds-alpha-7)","alpha-8":"var(--cds-alpha-8)","alpha-9":"var(--cds-alpha-9)","surface-0":"var(--cds-surface-0)","surface-1":"var(--cds-surface-1)","surface-2":"var(--cds-surface-2)","surface-3":"var(--cds-surface-3)","surface-popover":"var(--cds-surface-popover)","surface-panel":"var(--cds-surface-panel)","page":"var(--cds-page-bg)","fill-accent":"var(--cds-fill-accent)","fill-accent-hover":"var(--cds-fill-accent-hover)","fill-danger":"var(--cds-fill-danger)","fill-danger-hover":"var(--cds-fill-danger-hover)","fill-success":"var(--cds-fill-success)","fill-success-hover":"var(--cds-fill-success-hover)","fill-warning":"var(--cds-fill-warning)","fill-warning-hover":"var(--cds-fill-warning-hover)","fill-pro":"var(--cds-fill-pro)","fill-pro-hover":"var(--cds-fill-pro-hover)","fill-brand":"var(--cds-fill-brand)","fill-brand-hover":"var(--cds-fill-brand-hover)","fill-primary":"var(--cds-fill-primary)","fill-primary-hover":"var(--cds-fill-primary-hover)","fill-secondary":"var(--cds-fill-secondary)","fill-secondary-hover":"var(--cds-fill-secondary-hover)","fill-secondary-ring":"var(--cds-fill-secondary-ring)","fill-field":"var(--cds-fill-field)","fill-ghost-hover":"var(--cds-fill-ghost-hover)","fill-disabled":"var(--cds-fill-disabled)","fill-control":"var(--cds-fill-control)","fill-control-hover":"var(--cds-fill-control-hover)","accent":"var(--cds-bg-accent)","accent-chip":"var(--cds-bg-accent-chip)","danger":"var(--cds-bg-danger)","danger-chip":"var(--cds-bg-danger-chip)","success":"var(--cds-bg-success)","success-chip":"var(--cds-bg-success-chip)","warning":"var(--cds-bg-warning)","warning-chip":"var(--cds-bg-warning-chip)","pro":"var(--cds-bg-pro)","pro-chip":"var(--cds-bg-pro-chip)","pink":"var(--cds-bg-pink)","pink-chip":"var(--cds-bg-pink-chip)","neutral":"var(--cds-bg-neutral)","neutral-hover":"var(--cds-bg-neutral-hover)","neutral-chip":"var(--cds-bg-neutral-chip)","neutral-chip-hover":"var(--cds-bg-neutral-chip-hover)","backdrop":"var(--cds-backdrop)"},"textColor":{"oncolor-200":"var(--cds-oncolor-200)","oncolor-300":"var(--cds-oncolor-300)","accent":"var(--cds-text-accent)","danger":"var(--cds-text-danger)","success":"var(--cds-text-success)","warning":"var(--cds-text-warning)","pro":"var(--cds-text-pro)","pink":"var(--cds-text-pink)","primary":"var(--cds-text-primary)","secondary":"var(--cds-text-secondary)","muted":"var(--cds-text-muted)","disabled":"var(--cds-text-disabled)","on-primary":"var(--cds-on-primary)","on-accent":"var(--cds-on-accent)","on-danger":"var(--cds-on-danger)","on-success":"var(--cds-on-success)","on-warning":"var(--cds-on-warning)","on-pro":"var(--cds-on-pro)","on-brand":"var(--cds-on-brand)"},"borderColor":{"DEFAULT":"var(--cds-border)","accent":"var(--cds-border-accent)","danger":"var(--cds-border-danger)","success":"var(--cds-border-success)","warning":"var(--cds-border-warning)","pro":"var(--cds-border-pro)","strong":"var(--cds-border-strong)","stronger":"var(--cds-border-stronger)","alpha-0":"var(--cds-alpha-0)","alpha-1":"var(--cds-alpha-1)","alpha-2":"var(--cds-alpha-2)","alpha-3":"var(--cds-alpha-3)","alpha-4":"var(--cds-alpha-4)","alpha-5":"var(--cds-alpha-5)","alpha-6":"var(--cds-alpha-6)","alpha-7":"var(--cds-alpha-7)","alpha-8":"var(--cds-alpha-8)","alpha-9":"var(--cds-alpha-9)"},"ringColor":{"DEFAULT":"var(--cds-border)","accent":"var(--cds-border-accent)","danger":"var(--cds-border-danger)","success":"var(--cds-border-success)","warning":"var(--cds-border-warning)","pro":"var(--cds-border-pro)","strong":"var(--cds-border-strong)","stronger":"var(--cds-border-stronger)","alpha-0":"var(--cds-alpha-0)","alpha-1":"var(--cds-alpha-1)","alpha-2":"var(--cds-alpha-2)","alpha-3":"var(--cds-alpha-3)","alpha-4":"var(--cds-alpha-4)","alpha-5":"var(--cds-alpha-5)","alpha-6":"var(--cds-alpha-6)","alpha-7":"var(--cds-alpha-7)","alpha-8":"var(--cds-alpha-8)","alpha-9":"var(--cds-alpha-9)","fill-accent":"var(--cds-fill-accent)","fill-secondary":"var(--cds-fill-secondary-ring)"},"outlineColor":{"DEFAULT":"var(--cds-border)","accent":"var(--cds-border-accent)","danger":"var(--cds-border-danger)","success":"var(--cds-border-success)","warning":"var(--cds-border-warning)","pro":"var(--cds-border-pro)","strong":"var(--cds-border-strong)","stronger":"var(--cds-border-stronger)","alpha-0":"var(--cds-alpha-0)","alpha-1":"var(--cds-alpha-1)","alpha-2":"var(--cds-alpha-2)","alpha-3":"var(--cds-alpha-3)","alpha-4":"var(--cds-alpha-4)","alpha-5":"var(--cds-alpha-5)","alpha-6":"var(--cds-alpha-6)","alpha-7":"var(--cds-alpha-7)","alpha-8":"var(--cds-alpha-8)","alpha-9":"var(--cds-alpha-9)","fill-accent":"var(--cds-fill-accent)","fill-secondary":"var(--cds-fill-secondary-ring)"},"divideColor":{"DEFAULT":"var(--cds-border)","accent":"var(--cds-border-accent)","danger":"var(--cds-border-danger)","success":"var(--cds-border-success)","warning":"var(--cds-border-warning)","pro":"var(--cds-border-pro)","strong":"var(--cds-border-strong)","stronger":"var(--cds-border-stronger)","alpha-0":"var(--cds-alpha-0)","alpha-1":"var(--cds-alpha-1)","alpha-2":"var(--cds-alpha-2)","alpha-3":"var(--cds-alpha-3)","alpha-4":"var(--cds-alpha-4)","alpha-5":"var(--cds-alpha-5)","alpha-6":"var(--cds-alpha-6)","alpha-7":"var(--cds-alpha-7)","alpha-8":"var(--cds-alpha-8)","alpha-9":"var(--cds-alpha-9)"},"textDecorationColor":{"oncolor-200":"var(--cds-oncolor-200)","oncolor-300":"var(--cds-oncolor-300)","alpha-0":"var(--cds-alpha-0)","alpha-1":"var(--cds-alpha-1)","alpha-2":"var(--cds-alpha-2)","alpha-3":"var(--cds-alpha-3)","alpha-4":"var(--cds-alpha-4)","alpha-5":"var(--cds-alpha-5)","alpha-6":"var(--cds-alpha-6)","alpha-7":"var(--cds-alpha-7)","alpha-8":"var(--cds-alpha-8)","alpha-9":"var(--cds-alpha-9)","accent":"var(--cds-text-accent)","danger":"var(--cds-text-danger)","success":"var(--cds-text-success)","warning":"var(--cds-text-warning)","pro":"var(--cds-text-pro)","pink":"var(--cds-text-pink)","primary":"var(--cds-text-primary)","secondary":"var(--cds-text-secondary)","muted":"var(--cds-text-muted)","disabled":"var(--cds-text-disabled)","on-primary":"var(--cds-on-primary)","on-accent":"var(--cds-on-accent)","on-danger":"var(--cds-on-danger)","on-success":"var(--cds-on-success)","on-warning":"var(--cds-on-warning)","on-pro":"var(--cds-on-pro)","on-brand":"var(--cds-on-brand)"},"fill":{"accent":"var(--cds-fill-accent)","danger":"var(--cds-fill-danger)","success":"var(--cds-fill-success)","warning":"var(--cds-fill-warning)","pro":"var(--cds-fill-pro)","brand":"var(--cds-fill-brand)","primary":"var(--cds-fill-primary)","secondary":"var(--cds-fill-secondary)"},"height":{"control":"var(--cds-h-control)","control-nested":"var(--cds-h-control-nested)","icon":"var(--cds-icon)"},"width":{"control":"var(--cds-h-control)","icon":"var(--cds-icon)"},"size":{"control":"var(--cds-h-control)","icon":"var(--cds-icon)"},"minHeight":{"control":"var(--cds-h-control)"},"gap":{"xs":"var(--cds-gap-xs)","sm":"var(--cds-gap-sm)","md":"var(--cds-gap-md)","lg":"var(--cds-gap-lg)","xl":"var(--cds-gap-xl)"},"margin":{"pad-sm":"var(--cds-pad-sm)","pad-md":"var(--cds-pad-md)","pad-lg":"var(--cds-pad-lg)","pad-xl":"var(--cds-pad-xl)","xs":"var(--cds-gap-xs)","sm":"var(--cds-gap-sm)","md":"var(--cds-gap-md)","lg":"var(--cds-gap-lg)","xl":"var(--cds-gap-xl)"},"padding":{"sm":"var(--cds-pad-sm)","md":"var(--cds-pad-md)","lg":"var(--cds-pad-lg)","xl":"var(--cds-pad-xl)"},"borderRadius":{"DEFAULT":"var(--cds-radius)","card":"calc(var(--cds-radius) + 4px)","chip":"calc(var(--cds-h-control-nested) / 4)"},"fontSize":{"caption":["var(--cds-font-size-caption)",{"lineHeight":"var(--cds-leading-caption)"}],"footnote":["var(--cds-font-size-footnote)",{"lineHeight":"var(--cds-leading-footnote)"}],"code":["var(--cds-font-size-code)",{"lineHeight":"var(--cds-leading-code)"}],"body":["var(--cds-font-size-body)",{"lineHeight":"var(--cds-leading-body)"}],"heading":["var(--cds-font-size-heading)",{"lineHeight":"var(--cds-leading-heading)"}],"title":["var(--cds-font-size-title)",{"lineHeight":"var(--cds-leading-title)"}]},"fontFamily":{"mono":"var(--cds-font-mono)","sans":"var(--cds-font-sans)","voice":"var(--cds-font-voice)"},"boxShadow":{"sm":"var(--cds-shadow-sm)","md":"var(--cds-shadow-md)","lg":"var(--cds-shadow-lg)","popover":"var(--cds-shadow-popover)","focus":"var(--cds-focus-shadow)","field":"inset 0 0 0 1px var(--cds-fill-secondary-ring), 0 1px 2px 0 rgb(0 0 0 / 0.05)","field-drop":"0 1px 2px 0 rgb(0 0 0 / 0.05)","field-ring":"inset 0 0 0 1px var(--cds-fill-secondary-ring)","field-hover":"inset 0 0 0 1px var(--cds-border-strong)","field-invalid":"inset 0 0 0 1px var(--cds-fill-danger)","panel":"inset 0 0 0 var(--cds-ring-inner) var(--cds-ring-color), 0 0 0 var(--cds-ring-outer) var(--cds-ring-color), var(--cds-shadow-popover)","panel-sm":"inset 0 0 0 var(--cds-ring-inner) var(--cds-ring-color), 0 0 0 var(--cds-ring-outer) var(--cds-ring-color), var(--cds-shadow-sm)","panel-md":"inset 0 0 0 var(--cds-ring-inner) var(--cds-ring-color), 0 0 0 var(--cds-ring-outer) var(--cds-ring-color), var(--cds-shadow-md)","panel-lg":"inset 0 0 0 var(--cds-ring-inner) var(--cds-ring-color), 0 0 0 var(--cds-ring-outer) var(--cds-ring-color), var(--cds-shadow-lg)","card-ring":"inset 0 0 0 var(--cds-ring-inner) var(--cds-ring-color), 0 0 0 var(--cds-ring-outer) var(--cds-ring-color)","ring-warning":"inset 0 0 0 1px var(--cds-border-warning)","ring-danger":"inset 0 0 0 1px var(--cds-border-danger)","ring-success":"inset 0 0 0 1px var(--cds-border-success)"},"transitionDuration":{"fast":"var(--cds-dur-fast)","snap":"var(--cds-dur-snap)","base":"var(--cds-dur-base)","slow":"var(--cds-dur-slow)"},"transitionTimingFunction":{"out":"var(--cds-ease-out)","snap":"var(--cds-ease-snap)","overshoot":"var(--cds-ease-overshoot)"},"zIndex":{"modal":"var(--cds-z-modal)","popover":"var(--cds-z-popover)","tooltip":"var(--cds-z-tooltip)","toast":"var(--cds-z-toast)"}}`)
    },
    {
        themeExtend: Q
    } = Re,
    {
        TYPE_SCALE: ze,
        TYPE_WEIGHTS: Be
    } = Re.families,
    $ = e => Object.keys(e ? ? {}).filter(e => e !== `DEFAULT`),
    Ve = $(Q.padding),
    He = $(Q.margin),
    Ue = $(Q.gap),
    We = (e, t) => Object.fromEntries([``, `x`, `y`, `s`, `e`, `t`, `r`, `b`, `l`].map(n => [`${e}${n}`, [{
        [`${e}${n}`]: t
    }]])),
    Ge = [...ze, ...ze.flatMap(e => Object.keys(Be).map(t => `${e}-${t}`))],
    Ke = Le({
        extend: {
            theme: {
                radius: $(Q.borderRadius)
            },
            classGroups: {
                "font-size": [{
                    text: Ge
                }],
                "font-family": [{
                    font: $(Q.fontFamily)
                }],
                h: [{
                    h: $(Q.height)
                }],
                w: [{
                    w: $(Q.width)
                }],
                size: [{
                    size: $(Q.size)
                }],
                "min-h": [{
                    "min-h": $(Q.minHeight)
                }],
                shadow: [{
                    shadow: $(Q.boxShadow)
                }],
                duration: [{
                    duration: $(Q.transitionDuration)
                }],
                ease: [{
                    ease: $(Q.transitionTimingFunction)
                }],
                z: [{
                    z: $(Q.zIndex)
                }],
                ...We(`p`, Ve),
                ...We(`m`, He),
                gap: [{
                    gap: Ue
                }],
                "gap-x": [{
                    "gap-x": Ue
                }],
                "gap-y": [{
                    "gap-y": Ue
                }]
            }
        }
    });

function qe(...e) {
    return Ke(t(e))
}
export {
    t as n, qe as t
};