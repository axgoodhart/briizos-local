import {
    nt as e
} from "./index-DxZs6uan.js";
var t = [{
        id: `design`,
        label: `Design`,
        icon: `Styles`
    }, {
        id: `engineering`,
        label: `Engineering`,
        icon: `Code`
    }, {
        id: `pm`,
        label: `Product`,
        icon: `Signpost`
    }, {
        id: `sales`,
        label: `Sales`,
        icon: `Chart`
    }, {
        id: `data`,
        label: `Data`,
        icon: `Database`
    }, {
        id: `marketing`,
        label: `Marketing`,
        icon: `Mailbox`
    }, {
        id: `other`,
        label: `Other`,
        icon: `Star`
    }],
    n = [{
        id: `mockups`,
        label: `Product mockups`,
        roles: [`design`, `pm`, `engineering`]
    }, {
        id: `slides`,
        label: `Slide decks`,
        roles: [`sales`, `marketing`, `pm`, `data`]
    }, {
        id: `prototypes`,
        label: `Interactive prototypes`,
        roles: [`design`, `engineering`, `pm`]
    }, {
        id: `dashboards`,
        label: `Data dashboards`,
        roles: [`data`, `pm`, `engineering`]
    }, {
        id: `landing`,
        label: `Landing pages`,
        roles: [`marketing`, `design`]
    }, {
        id: `brand`,
        label: `Brand assets`,
        roles: [`marketing`, `design`]
    }, {
        id: `onepagers`,
        label: `One-pagers`,
        roles: [`sales`, `marketing`, `pm`]
    }, {
        id: `wireframes`,
        label: `Wireframes`,
        roles: [`design`, `pm`]
    }, {
        id: `handoff`,
        label: `Dev handoff`,
        roles: [`design`, `engineering`]
    }, {
        id: `reports`,
        label: `Reports & docs`,
        roles: [`data`, `pm`, `other`]
    }, {
        id: `explore`,
        label: `Just exploring`,
        roles: []
    }],
    r = [{
        id: `create`,
        label: `Create`
    }, {
        id: `import`,
        label: `Import`
    }, {
        id: `iterate`,
        label: `Iterate`
    }, {
        id: `refine`,
        label: `Refine`
    }, {
        id: `share`,
        label: `Share`
    }, {
        id: `scale`,
        label: `Scale`
    }],
    i = [{
        id: `slides`,
        stage: `create`,
        title: `Start with slides`,
        pictogram: `Object-Slides.svg`,
        description: `Pick Slide deck when you create a project and describe your deck. Claude builds the full presentation — layout, content, speaker notes — in one pass.`,
        useCases: [`slides`, `onepagers`, `reports`]
    }, {
        id: `mockup`,
        stage: `create`,
        title: `Mock it up`,
        pictogram: `Object-Presentation.svg`,
        description: `Design mode starts with quick wireframe explorations before committing to high fidelity. Say what the screen does; Claude sketches options.`,
        useCases: [`mockups`, `wireframes`, `landing`]
    }, {
        id: `prototype`,
        stage: `create`,
        title: `Make it interactive`,
        pictogram: `Object-Bulb.svg`,
        description: `Prototype mode builds a real working app — state, transitions, API calls. Your prototype can even call the Claude API directly without a backend.`,
        useCases: [`prototypes`, `dashboards`]
    }, {
        id: `import`,
        stage: `import`,
        title: `Bring your context`,
        pictogram: `Object-Folder.svg`,
        description: `Drop images or paste screenshots with ⌘V. Mount a local folder from the Import menu so Claude reads your codebase live.`,
        useCases: []
    }, {
        id: `comment`,
        stage: `iterate`,
        title: `Point at what to change`,
        pictogram: `Object-Chat.svg`,
        description: `Click Comment in the toolbar, then click any element to annotate it. Leave several — they batch into one message when you send.`,
        useCases: []
    }, {
        id: `refine`,
        stage: `refine`,
        title: `Tweak values live`,
        pictogram: `Object-Gears.svg`,
        description: `Knobs mode lets you drag CSS values — sizes, colors, spacing — directly in the preview. Then prompt Claude to apply your adjustments.`,
        useCases: [`mockups`, `prototypes`, `landing`]
    }, {
        id: `textedit`,
        stage: `refine`,
        title: `Rewrite copy in place`,
        pictogram: `Object-Pencil.svg`,
        description: `Text edit mode lets you click any text in the preview and type over it. Your edits show as chips in the composer before sending.`,
        useCases: [`slides`, `landing`, `onepagers`, `brand`]
    }, {
        id: `napkin`,
        stage: `iterate`,
        title: `Sketch an idea`,
        pictogram: `Object-PencilBox.svg`,
        description: `The napkin tool lets you draw a rough layout freehand. Claude reads your sketch and turns it into a real design.`,
        useCases: [`wireframes`, `mockups`, `explore`]
    }, {
        id: `export`,
        stage: `share`,
        title: `Export anywhere`,
        pictogram: `Object-ArrowCircle.svg`,
        description: `The Share menu exports to PPTX, PDF, or a self-contained HTML bundle. Share a link internally or download the whole project.`,
        useCases: [`slides`, `onepagers`, `reports`]
    }, {
        id: `handoff`,
        stage: `share`,
        title: `Hand off to engineering`,
        pictogram: `Object-CodeTerminal.svg`,
        description: `Handoff to Claude Code packages specs and structure into a dev-ready folder. Download it, then tell Claude Code “create this design.”`,
        useCases: [`handoff`, `mockups`, `prototypes`]
    }, {
        id: `templates`,
        stage: `scale`,
        title: `Save it as a template`,
        pictogram: `Object-Book.svg`,
        description: `Turn any project into a Template so every new project starts on-style — just ask Claude to "save this as a template".`,
        useCases: [`brand`, `slides`, `landing`]
    }],
    a = [{
        bg: `#D97757`,
        texture: `Swoop.svg`
    }, {
        bg: `#6A9BCC`,
        texture: `Loop.svg`
    }, {
        bg: `#788C5D`,
        texture: `Topo.svg`
    }, {
        bg: `#C46686`,
        texture: `Grain.svg`
    }, {
        bg: `#B05E43`,
        texture: `Loop.svg`
    }, {
        bg: `#5A8BBB`,
        texture: `Swoop.svg`
    }, {
        bg: `#A63244`,
        texture: `Topo.svg`
    }, {
        bg: `#558A42`,
        texture: `Grain.svg`
    }, {
        bg: `#C9A82D`,
        texture: `Swoop.svg`
    }, {
        bg: `#73726C`,
        texture: `Loop.svg`
    }];

function o(e) {
    return e.length === 0 ? n : n.filter(t => t.roles.length === 0 || t.roles.some(t => e.includes(t)))
}

function s(t, n = 6) {
    let a = e => e.useCases.length === 0 || e.useCases.some(e => t.includes(e)),
        o = e() ? i : i.filter(e => e.id !== `templates`),
        s = t.length === 0 ? o : o.filter(a),
        c = [],
        l = new Set;
    for (let e of r) {
        let t = s.find(t => t.stage === e.id && !l.has(t.id));
        if (t && (c.push(t), l.add(t.id)), c.length >= n) break
    }
    for (let e of [...s, ...i]) {
        if (c.length >= n) break;
        l.has(e.id) || (c.push(e), l.add(e.id))
    }
    return c.slice(0, n)
}
var c = `omelette-onboarding-v1`,
    l = new Set([`roles`, `usecases`, `ready`, `story`]),
    u = new Set(t.map(e => e.id)),
    d = e => Array.isArray(e) && e.every(e => typeof e == `string`);

function f() {
    try {
        let e = localStorage.getItem(c);
        if (!e) return null;
        let t = JSON.parse(e);
        return !d(t.roles) || !t.roles.every(e => u.has(e)) || !d(t.useCases) || typeof t.screen != `string` || !l.has(t.screen) ? null : {
            roles: t.roles,
            useCases: t.useCases,
            screen: t.screen
        }
    } catch {
        return null
    }
}

function p(e) {
    try {
        localStorage.setItem(c, JSON.stringify(e))
    } catch {}
}

function m() {
    try {
        localStorage.removeItem(c)
    } catch {}
}
export {
    o as a, s as i, t as n, f as o, m as r, p as s, a as t
};