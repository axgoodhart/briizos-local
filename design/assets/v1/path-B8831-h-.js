var e = new Set;

function t(t) {
    return e.add(t), () => {
        e.delete(t)
    }
}
async function n() {
    let t = [...e].map(e => e());
    await Promise.all(t)
}
var r = new Map;

function i(e, t) {
    return r.set(e, t), () => {
        r.get(e) === t && r.delete(e)
    }
}

function a(e) {
    return r.get(e) ? .() ? ? null
}
var o = [`#8B2500`, `#C2622D`, `#3D7C2F`, `#2D7DD2`, `#000000`],
    s = [2, 6],
    c = {
        yellow: `#FEF3C7`,
        pink: `#FCE7F3`,
        blue: `#DBEAFE`,
        green: `#D1FAE5`,
        purple: `#EDE9FE`,
        orange: `#FFEDD5`
    },
    l = `omelette/sketch-objects-v1`,
    u = `web application/vnd.omelette.sketch+json`,
    d = {
        width: 150,
        height: 150
    },
    f = {
        width: 100,
        height: 60
    },
    p = {
        button: {
            width: 80,
            height: 36
        },
        input: {
            width: 200,
            height: 40
        },
        checkbox: {
            width: 20,
            height: 20
        },
        radio: {
            width: 20,
            height: 20
        },
        toggle: {
            width: 44,
            height: 24
        },
        dropdown: {
            width: 200,
            height: 40
        }
    },
    m = {
        color: `#8B2500`,
        brushSize: 2,
        strokeWidth: 2,
        fontSize: 16,
        bold: !1,
        stickyColor: `yellow`,
        shapeFill: null,
        uiVariant: `primary`
    };

function h(e, t, n) {
    return t.split(`
`).flatMap(t => {
        if (!t) return [``];
        let r = t.split(` `),
            i = [],
            a = ``;
        for (let t of r) {
            if (e.measureText(t).width > n) {
                a && = (i.push(a), ``);
                let r = ``;
                for (let a of t) e.measureText(r + a).width > n && r ? (i.push(r), r = a) : r += a;
                a = r;
                continue
            }
            let r = a ? `${a} ${t}` : t;
            e.measureText(r).width > n && a ? (i.push(a), a = t) : a = r
        }
        return a && i.push(a), i
    })
}

function g() {
    return Math.random().toString(36).substring(2, 11)
}

function _(e) {
    switch (e.type) {
        case `stroke`:
            {
                let t = e.data.points;
                if (t.length === 0) return {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };
                let n = t.map(e => e.x),
                    r = t.map(e => e.y),
                    i = Math.min(...n),
                    a = Math.min(...r);
                return {
                    x: i,
                    y: a,
                    width: Math.max(...n) - i,
                    height: Math.max(...r) - a
                }
            }
        case `line`:
            return {
                x: Math.min(e.x, e.endX),
                y: Math.min(e.y, e.endY),
                width: Math.abs(e.endX - e.x),
                height: Math.abs(e.endY - e.y)
            };
        case `text`:
            return {
                x: e.x,
                y: e.y,
                width: e.width || 100,
                height: e.height || 20
            };
        default:
            return {
                x: e.x,
                y: e.y,
                width: e.width || 0,
                height: e.height || 0
            }
    }
}

function v(e, t, n) {
    if (n.type === `line`) {
        let r = n.endX - n.x,
            i = n.endY - n.y,
            a = r * r + i * i,
            o = a === 0 ? 0 : Math.max(0, Math.min(1, ((e - n.x) * r + (t - n.y) * i) / a));
        return Math.hypot(e - (n.x + o * r), t - (n.y + o * i)) <= Math.max(n.data.strokeWidth, 4) + 4
    }
    let r = _(n);
    return e >= r.x - 4 && e <= r.x + r.width + 4 && t >= r.y - 4 && t <= r.y + r.height + 4
}

function y(e, t, n) {
    if (n.type === `line`) return Math.hypot(e - n.x, t - n.y) <= 12 ? `line-start` : Math.hypot(e - n.endX, t - n.endY) <= 12 ? `line-end` : null;
    let r = _(n),
        i = [{
            handle: `nw`,
            hx: r.x - 4,
            hy: r.y - 4
        }, {
            handle: `ne`,
            hx: r.x + r.width + 4,
            hy: r.y - 4
        }, {
            handle: `se`,
            hx: r.x + r.width + 4,
            hy: r.y + r.height + 4
        }, {
            handle: `sw`,
            hx: r.x - 4,
            hy: r.y + r.height + 4
        }];
    for (let {
            handle: n,
            hx: r,
            hy: a
        } of i)
        if (e >= r - 12 / 2 && e <= r + 12 / 2 && t >= a - 12 / 2 && t <= a + 12 / 2) return n;
    let a = r.x - 4,
        o = r.x + r.width + 4,
        s = r.y - 4,
        c = r.y + r.height + 4;
    return e >= a && e <= o && Math.abs(t - s) <= 6 ? `n` : e >= a && e <= o && Math.abs(t - c) <= 6 ? `s` : t >= s && t <= c && Math.abs(e - a) <= 6 ? `w` : t >= s && t <= c && Math.abs(e - o) <= 6 ? `e` : null
}
var b = 50,
    x = new Map,
    S = new Map;

function C() {
    for (; x.size > b;) {
        let e = x.keys().next().value;
        if (e === void 0) break;
        x.delete(e), S.delete(e)
    }
}

function w(e) {
    let t = x.get(e);
    if (t) return x.delete(e), x.set(e, t), t;
    let n = new Promise((t, n) => {
        let r = new Image;
        r.onload = () => {
            S.set(e, r), x.has(e) || x.set(e, Promise.resolve(r)), t(r)
        }, r.onerror = t => {
            x.delete(e), n(t)
        }, r.src = e
    });
    return x.set(e, n), C(), n
}

function T(e) {
    let t = S.get(e);
    if (!t) return null;
    let n = x.get(e);
    return n && (x.delete(e), x.set(e, n)), t
}

function E(e) {
    if (e.length < 2) return ``;
    let t = `M ${e[0].x} ${e[0].y}`;
    if (e.length === 2) return t += ` L ${e[1].x} ${e[1].y}`, t;
    for (let n = 0; n < e.length - 1; n++) {
        let r = e[n - 1] || e[n],
            i = e[n],
            a = e[n + 1],
            o = e[n + 2] || a,
            s = i.x + (a.x - r.x) / 6,
            c = i.y + (a.y - r.y) / 6,
            l = a.x - (o.x - i.x) / 6,
            u = a.y - (o.y - i.y) / 6;
        t += ` C ${s} ${c}, ${l} ${u}, ${a.x} ${a.y}`
    }
    return t
}

function D(e, t, n, r, i, a) {
    let o = i || {
            x: 0,
            y: 0
        },
        s = a || 1,
        c = -o.x / s,
        l = -o.y / s,
        u = t / s,
        d = n / s,
        f = c + u,
        p = l + d;
    if (e.fillStyle = `#F9F8F5`, e.fillRect(c, l, u, d), e.fillStyle = `rgba(255, 255, 255, 0.7)`, e.fillRect(c, l, u, d), r === `dots` || r === `grid`) {
        let t = Math.floor(c / 20) * 20 + 20,
            n = Math.floor(l / 20) * 20 + 20;
        e.fillStyle = `rgba(114, 113, 107, 0.3)`;
        for (let r = t; r < f; r += 20)
            for (let t = n; t < p; t += 20) e.beginPath(), e.arc(r, t, 1, 0, Math.PI * 2), e.fill()
    }
}

function O(e, t, n, r, i, a) {
    let o = 14 * 1.3,
        s = i - 24;
    e.save(), e.font = `14px system-ui, sans-serif`, e.fillStyle = `#1a1a1a`, e.textAlign = `center`, e.textBaseline = `middle`;
    let c = h(e, t, s),
        l = r + (a - c.length * o) / 2 + o / 2,
        u = n + i / 2;
    for (let t = 0; t < c.length; t++) e.fillText(c[t], u, l + t * o, s);
    e.restore()
}

function k(e, t) {
    if (e.save(), t.rotation) {
        let n = t.x + (t.width || 0) / 2,
            r = t.y + (t.height || 0) / 2;
        e.translate(n, r), e.rotate(t.rotation * Math.PI / 180), e.translate(-n, -r)
    }
    switch (t.type) {
        case `stroke`:
            {
                let {
                    points: n,
                    color: r,
                    size: i
                } = t.data;
                if (n.length < 2) break;e.strokeStyle = r,
                e.lineWidth = i,
                e.lineCap = `round`,
                e.lineJoin = `round`,
                e.stroke(new Path2D(E(n)));
                break
            }
        case `rect`:
            {
                let {
                    fill: n,
                    stroke: r,
                    strokeWidth: i,
                    cornerRadius: a,
                    text: o
                } = t.data;
                if (e.beginPath(), a) {
                    let n = Math.min(a, t.width / 2, t.height / 2);
                    e.roundRect(t.x, t.y, t.width, t.height, n)
                } else e.rect(t.x, t.y, t.width, t.height);n && (e.fillStyle = n, e.fill()),
                e.strokeStyle = r,
                e.lineWidth = i,
                e.stroke(),
                o && O(e, o, t.x, t.y, t.width, t.height);
                break
            }
        case `ellipse`:
            {
                let {
                    fill: n,
                    stroke: r,
                    strokeWidth: i,
                    text: a
                } = t.data;e.beginPath(),
                e.ellipse(t.x + t.width / 2, t.y + t.height / 2, t.width / 2, t.height / 2, 0, 0, Math.PI * 2),
                n && (e.fillStyle = n, e.fill()),
                e.strokeStyle = r,
                e.lineWidth = i,
                e.stroke(),
                a && O(e, a, t.x, t.y, t.width, t.height);
                break
            }
        case `line`:
            {
                let {
                    stroke: n,
                    strokeWidth: r
                } = t.data,
                i = Math.atan2(t.endY - t.y, t.endX - t.x),
                a = Math.max(12, r * 4);e.beginPath(),
                e.moveTo(t.x, t.y),
                e.lineTo(t.endX, t.endY),
                e.strokeStyle = n,
                e.lineWidth = r,
                e.lineCap = `round`,
                e.lineJoin = `round`,
                e.stroke(),
                e.beginPath(),
                e.moveTo(t.endX - a * Math.cos(i - Math.PI / 6), t.endY - a * Math.sin(i - Math.PI / 6)),
                e.lineTo(t.endX, t.endY),
                e.lineTo(t.endX - a * Math.cos(i + Math.PI / 6), t.endY - a * Math.sin(i + Math.PI / 6)),
                e.stroke();
                break
            }
        case `text`:
            {
                let {
                    content: n,
                    fontSize: r,
                    color: i,
                    bold: a
                } = t.data;e.font = `${a?`bold `:``}${r}px system-ui, sans-serif`,
                e.fillStyle = i,
                e.textBaseline = `top`;
                let o = r * 1.3;t.width && t.width > 0 ? h(e, n, t.width).forEach((n, r) => {
                    e.fillText(n, t.x, t.y + r * o)
                }) : n.split(`
`).forEach((n, r) => {
                    e.fillText(n, t.x, t.y + r * o)
                });
                break
            }
        case `sticky`:
            {
                let n = c[t.data.color],
                    r = Math.min(16, t.width * .1, t.height * .1);e.beginPath(),
                e.moveTo(t.x, t.y),
                e.lineTo(t.x + t.width - r, t.y),
                e.lineTo(t.x + t.width, t.y + r),
                e.lineTo(t.x + t.width, t.y + t.height),
                e.lineTo(t.x, t.y + t.height),
                e.closePath(),
                e.fillStyle = n,
                e.fill(),
                e.strokeStyle = `#00000020`,
                e.lineWidth = 1,
                e.stroke(),
                e.beginPath(),
                e.moveTo(t.x + t.width - r, t.y),
                e.lineTo(t.x + t.width - r, t.y + r),
                e.lineTo(t.x + t.width, t.y + r),
                e.closePath(),
                e.fillStyle = `rgba(0, 0, 0, 0.06)`,
                e.fill(),
                e.strokeStyle = `#00000020`,
                e.lineWidth = .5,
                e.stroke(),
                e.save(),
                e.beginPath(),
                e.rect(t.x, t.y, t.width, t.height),
                e.clip(),
                e.font = `14px system-ui, sans-serif`,
                e.fillStyle = `#1F2937`,
                e.textBaseline = `top`,
                h(e, t.data.content, t.width - 16).forEach((n, r) => {
                    e.fillText(n, t.x + 8, t.y + 8 + r * 18)
                }),
                e.restore();
                break
            }
        case `image`:
            {
                let n = T(t.data.src);n ? e.drawImage(n, t.x, t.y, t.width, t.height) : (e.fillStyle = `#F3F4F6`, e.fillRect(t.x, t.y, t.width, t.height), e.strokeStyle = `#D1D5DB`, e.lineWidth = 1, e.strokeRect(t.x, t.y, t.width, t.height));
                break
            }
        case `ui-button`:
            {
                let {
                    variant: n,
                    label: r
                } = t.data,
                {
                    width: i,
                    height: a
                } = t;n === `primary` ? (e.fillStyle = `#3B82F6`, e.beginPath(), e.roundRect(t.x, t.y, i, a, 6), e.fill(), e.fillStyle = `#FFFFFF`) : n === `secondary` ? (e.fillStyle = `#FFFFFF`, e.strokeStyle = `#D1D5DB`, e.lineWidth = 1, e.beginPath(), e.roundRect(t.x, t.y, i, a, 6), e.fill(), e.stroke(), e.fillStyle = `#1F2937`) : e.fillStyle = `#1F2937`,
                e.font = `14px system-ui, sans-serif`,
                e.textAlign = `center`,
                e.textBaseline = `middle`,
                e.fillText(r, t.x + i / 2, t.y + a / 2),
                e.textAlign = `left`;
                break
            }
        case `ui-input`:
            e.fillStyle = `#FFFFFF`, e.strokeStyle = `#D1D5DB`, e.lineWidth = 1, e.beginPath(), e.roundRect(t.x, t.y, t.width, t.height, 6), e.fill(), e.stroke(), t.data.placeholder && (e.font = `14px system-ui, sans-serif`, e.fillStyle = `#9CA3AF`, e.textBaseline = `middle`, e.fillText(t.data.placeholder, t.x + 12, t.y + t.height / 2));
            break;
        case `ui-checkbox`:
            {
                let n = p.checkbox.width;e.fillStyle = `#FFFFFF`,
                e.strokeStyle = `#D1D5DB`,
                e.lineWidth = 1,
                e.beginPath(),
                e.roundRect(t.x, t.y, n, n, 4),
                e.fill(),
                e.stroke(),
                t.data.checked && (e.strokeStyle = `#3B82F6`, e.lineWidth = 2, e.beginPath(), e.moveTo(t.x + 4, t.y + n / 2), e.lineTo(t.x + 8, t.y + n - 5), e.lineTo(t.x + n - 4, t.y + 5), e.stroke()),
                t.data.label && (e.font = `14px system-ui, sans-serif`, e.fillStyle = `#1F2937`, e.textBaseline = `middle`, e.fillText(t.data.label, t.x + n + 8, t.y + n / 2));
                break
            }
        case `ui-radio`:
            {
                let n = p.radio.width;e.fillStyle = `#FFFFFF`,
                e.strokeStyle = `#D1D5DB`,
                e.lineWidth = 1,
                e.beginPath(),
                e.arc(t.x + n / 2, t.y + n / 2, n / 2, 0, Math.PI * 2),
                e.fill(),
                e.stroke(),
                t.data.checked && (e.fillStyle = `#3B82F6`, e.beginPath(), e.arc(t.x + n / 2, t.y + n / 2, n / 4, 0, Math.PI * 2), e.fill()),
                t.data.label && (e.font = `14px system-ui, sans-serif`, e.fillStyle = `#1F2937`, e.textBaseline = `middle`, e.fillText(t.data.label, t.x + n + 8, t.y + n / 2));
                break
            }
        case `ui-toggle`:
            {
                let {
                    width: n,
                    height: r
                } = p.toggle,
                i = t.data.checked;e.fillStyle = i ? `#3B82F6` : `#D1D5DB`,
                e.beginPath(),
                e.roundRect(t.x, t.y, n, r, r / 2),
                e.fill();
                let a = i ? t.x + n - r / 2 : t.x + r / 2;e.fillStyle = `#FFFFFF`,
                e.beginPath(),
                e.arc(a, t.y + r / 2, r / 2 - 2, 0, Math.PI * 2),
                e.fill();
                break
            }
        case `ui-dropdown`:
            e.fillStyle = `#FFFFFF`, e.strokeStyle = `#D1D5DB`, e.lineWidth = 1, e.beginPath(), e.roundRect(t.x, t.y, t.width, t.height, 6), e.fill(), e.stroke(), e.font = `14px system-ui, sans-serif`, e.fillStyle = `#9CA3AF`, e.textBaseline = `middle`, e.fillText(t.data.placeholder || `Select...`, t.x + 12, t.y + t.height / 2), e.fillStyle = `#6B7280`, e.beginPath(), e.moveTo(t.x + t.width - 20, t.y + t.height / 2 - 3), e.lineTo(t.x + t.width - 16, t.y + t.height / 2 + 3), e.lineTo(t.x + t.width - 12, t.y + t.height / 2 - 3), e.fill();
            break
    }
    e.restore()
}
async function A(e, t, n, r, i) {
    let a = document.createElement(`canvas`),
        o = i ? .scale ? ? 2;
    a.width = t * o, a.height = n * o;
    let s = a.getContext(`2d`);
    if (!s) throw Error(`Failed to get canvas context`);
    s.scale(o, o), i && s.translate(-i.x, -i.y), D(s, i ? i.width : t, i ? i.height : n, r, i ? {
        x: -i.x,
        y: -i.y
    } : void 0);
    for (let t of e) k(s, t);
    return new Promise((e, t) => {
        a.toBlob(n => {
            n ? e(n) : t(Error(`Failed to create blob`))
        }, `image/png`, 1)
    })
}

function j() {
    return {
        exportToPNG: A,
        drawObject: k,
        drawBackground: D
    }
}

function M(e) {
    let t = e.split(/[/\\]/);
    return t[t.length - 1] || ``
}

function N(...e) {
    return e.filter(Boolean).join(`/`).replace(/\/+/g, `/`)
}
export {
    t as C, i as S, u as _, w as a, n as b, _ as c, h as d, s as f, f as g, o as h, E as i, y as l, m, N as n, j as o, d as p, k as r, g as s, M as t, v as u, l as v, a as x, c as y
};