const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/v1/bounce-eLW5-STV.js", "assets/v1/engine-DGdC5etr.js", "assets/v1/snake-Bl09Qc3Q.js", "assets/v1/gap-NKP_DCR3.js", "assets/v1/drift-D01_gALS.js", "assets/v1/memory-CudsXDg7.js", "assets/v1/orbit-Bi9KUVD6.js", "assets/v1/stack-B2sy-t8v.js", "assets/v1/recall-B4W6oNFQ.js", "assets/v1/lights-CaU2MrDF.js", "assets/v1/lander-aYYDnExj.js", "assets/v1/slide-Cr5JHilQ.js", "assets/v1/catch-X4eYzLqQ.js", "assets/v1/sweep-BBOjkhw2.js", "assets/v1/trace-DZuAZfk9.js"]))) => i.map(i => d[i]);
import {
    t as e
} from "./preload-helper-7XptfjGJ.js";
var t = [{
    id: `bounce`,
    name: `Spark bounce`,
    genre: `Paddle`,
    hint: `← → or mouse`,
    activeMsg: `Keep the spark in play`
}, {
    id: `snake`,
    name: `Loading snake`,
    genre: `Snake`,
    hint: `Arrow keys`,
    activeMsg: `Guide the loader`
}, {
    id: `drift`,
    name: `Spark drift`,
    genre: `Tap-to-rise`,
    hint: `Click or space`,
    activeMsg: `Stay aloft`
}, {
    id: `memory`,
    name: `Shimmer match`,
    genre: `Memory`,
    hint: `Click to flip`,
    activeMsg: `Match the pairs`
}, {
    id: `orbit`,
    name: `Orbit release`,
    genre: `Aim`,
    hint: `Click to release`,
    activeMsg: `Hit the targets`
}, {
    id: `stack`,
    name: `Progress stack`,
    genre: `Stacker`,
    hint: `Click to drop`,
    activeMsg: `Stack the bars`
}, {
    id: `herd`,
    name: `Particle herd`,
    genre: `Physics toy`,
    hint: `Move cursor to push`,
    activeMsg: `Herd into the ring`
}, {
    id: `recall`,
    name: `Tone recall`,
    genre: `Sequence`,
    hint: `Watch, then repeat`,
    activeMsg: `Repeat the sequence`
}, {
    id: `lights`,
    name: `Lights out`,
    genre: `Logic puzzle`,
    hint: `Click a cell`,
    activeMsg: `Turn every cell off`
}, {
    id: `lander`,
    name: `Spark lander`,
    genre: `Lander`,
    hint: `Click / space, ← →`,
    activeMsg: `Land softly on the pad`
}, {
    id: `slide`,
    name: `Tile slide`,
    genre: `8-puzzle`,
    hint: `Click a tile`,
    activeMsg: `Order the tiles`
}, {
    id: `catch`,
    name: `Spark catch`,
    genre: `Catcher`,
    hint: `← → or mouse`,
    activeMsg: `Catch clay, dodge slate`
}, {
    id: `gap`,
    name: `Gap timing`,
    genre: `Reflex`,
    hint: `Click on the marker`,
    activeMsg: `Hit the gap`
}, {
    id: `sweep`,
    name: `Token sweep`,
    genre: `Deduction grid`,
    hint: `Click safe · right-click flag`,
    activeMsg: `Avoid the mines`
}, {
    id: `trace`,
    name: `Path trace`,
    genre: `Maze`,
    hint: `Trace from the dot`,
    activeMsg: `Stay on the line`
}];

function n(e) {
    let n = t.find(t => t.id === e);
    if (!n) throw Error(`unknown waiting-game id: ${e}`);
    return n
}
var r = {
        bounce: () => e(() =>
            import (`./bounce-eLW5-STV.js`).then(e => e.bounce), __vite__mapDeps([0, 1])),
        snake: () => e(() =>
            import (`./snake-Bl09Qc3Q.js`).then(e => e.snake), __vite__mapDeps([2, 1])),
        gap: () => e(() =>
            import (`./gap-NKP_DCR3.js`).then(e => e.gap), __vite__mapDeps([3, 1])),
        drift: () => e(() =>
            import (`./drift-D01_gALS.js`).then(e => e.drift), __vite__mapDeps([4, 1])),
        memory: () => e(() =>
            import (`./memory-CudsXDg7.js`).then(e => e.memory), __vite__mapDeps([5, 1])),
        orbit: () => e(() =>
            import (`./orbit-Bi9KUVD6.js`).then(e => e.orbit), __vite__mapDeps([6, 1])),
        stack: () => e(() =>
            import (`./stack-B2sy-t8v.js`).then(e => e.stack), __vite__mapDeps([7, 1])),
        herd: () => e(() =>
            import (`./herd-BmJ7SxnN.js`).then(e => e.herd), []),
        recall: () => e(() =>
            import (`./recall-B4W6oNFQ.js`).then(e => e.recall), __vite__mapDeps([8, 1])),
        lights: () => e(() =>
            import (`./lights-CaU2MrDF.js`).then(e => e.lights), __vite__mapDeps([9, 1])),
        lander: () => e(() =>
            import (`./lander-aYYDnExj.js`).then(e => e.lander), __vite__mapDeps([10, 1])),
        slide: () => e(() =>
            import (`./slide-Cr5JHilQ.js`).then(e => e.slide), __vite__mapDeps([11, 1])),
        catch: () => e(() =>
            import (`./catch-X4eYzLqQ.js`).then(e => e.catcher), __vite__mapDeps([12, 1])),
        sweep: () => e(() =>
            import (`./sweep-BBOjkhw2.js`).then(e => e.sweep), __vite__mapDeps([13, 1])),
        trace: () => e(() =>
            import (`./trace-DZuAZfk9.js`).then(e => e.trace), __vite__mapDeps([14, 1]))
    },
    i = Object.keys(r);

function a(e) {
    return r[e]()
}
var o = `/design/assets/v1/spark-B8giJCoV.gif`;
export {
    n as i, i as n, a as r, o as t
};