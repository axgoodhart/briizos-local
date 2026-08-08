import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    d as t
} from "./client-lite-BraEm36W.js";
import {
    t as n
} from "./react-BthIFXYf.js";
import {
    S as r
} from "./useOrg-DgFJtzUv.js";
import {
    hn as i
} from "./fig-kit-coverage-DSUEqVg0.js";
import {
    t as a
} from "./jsx-runtime-DDrWIXeu.js";
import {
    t as o,
    ut as s
} from "./Button-JbIB5F4R.js";
import {
    n as c
} from "./cn-qYiRd2Uw.js";
import {
    a as l,
    d as u,
    i as d,
    r as f,
    t as p
} from "./useModelSelection-Gs9zlsOR.js";
import {
    t as m
} from "./Dialog-C1x8a90K.js";
import {
    t as h
} from "./Switch-BW47dRdR.js";
import {
    t as g
} from "./hooks-dYpRZMxP.js";
import {
    a as _,
    c as v,
    i as y,
    l as b,
    n as x,
    o as S,
    r as C,
    s as w,
    t as T,
    u as ee
} from "./schemas-DgQq6Z5S.js";
import {
    B as E,
    F as te,
    L as D,
    V as O,
    hn as ne,
    z as re
} from "./index-DxZs6uan.js";
import {
    T as ie
} from "./client-BkAIwXnN.js";
import {
    t as ae
} from "./platform-BciTLfG8.js";
import {
    a as oe
} from "./useUserSettings-DXDUhhmv.js";
var se = () => {
        let e = D(),
            {
                orgUuid: t
            } = e.useAccount(),
            n = e.loadShed ? ? !1;
        return i({
            mutationFn: r => {
                let i = e.apiClient.executeExperienceAction;
                return !t || n || i === void 0 ? Promise.reject(Error(`experience-framework: action execution unavailable`)) : i(t, r)
            }
        })
    },
    k = S({
        badgeText: v().optional(),
        title: v(),
        bodyText: v().optional(),
        bulletPoints: x(v()).optional(),
        numberedSteps: C().optional(),
        ctaCaption: v().optional(),
        ctaCaptionHref: v().optional(),
        ctaText: v(),
        ctaHref: v(),
        dismissText: v().optional(),
        imageUrl: v(),
        imageAlt: v().optional()
    }),
    ce = `value`,
    A = S({
        default_value: C().optional(),
        param_key: v().optional(),
        label: v().optional()
    }),
    le = S({
        title: v().optional(),
        text: v(),
        icon: v().optional(),
        toggle: A.optional().catch(void 0)
    }),
    j = {
        text: v(),
        isPrimary: C().optional()
    },
    M = {
        type: T([`href`, `model`, `upgrade`, `prompt`]),
        value: v(),
        nuxText: v().optional(),
        nuxBadgeText: v().optional(),
        postActionModel: v().optional(),
        sticky: C().optional()
    },
    ue = {
        type: y(`remote`),
        id: v(),
        params: w(ee()).optional()
    },
    N = b([S(M), S(ue)]),
    de = b([S({ ...j,
        actions: x(N).min(1)
    }), S({ ...j,
        ...M
    }), S({ ...j,
        ...ue
    })]),
    fe = S({
        badgeText: v().optional(),
        title: v(),
        bodyText: v().optional(),
        bulletPoints: x(le).optional(),
        bullets_style: T([`plain`, `card`, `icons`]).optional().catch(void 0),
        toggle: A.optional().catch(void 0),
        ctaCaption: v().optional(),
        ctaActions: x(de),
        dismissText: v().optional(),
        assetUrl: v().optional(),
        darkAssetUrl: v().optional(),
        videoUrl: v().optional(),
        assetAlt: v().optional(),
        layout: T([`horizontal`, `vertical`]).optional(),
        assetFit: T([`contain`, `cover`]).optional(),
        panelSplit: v().regex(/^\d+:\d+$/).optional().catch(void 0),
        maxWidth: _().optional(),
        heroBackground: T([`bg-bg-000`, `bg-bg-100`, `bg-bg-200`, `bg-bg-300`]).optional(),
        showVideoControls: C().optional()
    });

function pe(e) {
    return `actions` in e ? e.actions : [e]
}

function me(e, t) {
    return { ...e.params,
        ...t ? .toggleParams
    }
}

function P(e) {
    if (e.bullets_style !== `card`) return null;
    for (let [t, n] of (e.bulletPoints ? ? []).entries())
        if (n.toggle) return {
            toggle: n.toggle,
            bulletIndex: t
        };
    return e.toggle ? {
        toggle: e.toggle,
        bulletIndex: null
    } : null
}
var F = a(),
    I = e(n()),
    he = (0, I.memo)(({
        content: e,
        onCtaClick: t,
        onDismiss: n,
        ImageComponent: r,
        CtaCaptionLink: i,
        classNames: a
    }) => {
        let s = r ? ? `img`,
            l = i ? ? ge,
            d = te()(),
            f = e.ctaCaptionHref && /^https?:\/\//.test(e.ctaCaptionHref) ? e.ctaCaptionHref : void 0,
            p = d({
                defaultMessage: `Close`,
                id: `rbrahOGMC3`
            }),
            h = e.imageAlt ? ? e.title;
        return (0, F.jsxs)(F.Fragment, {
            children: [(0, F.jsxs)(`div`, {
                className: `absolute inset-0 -z-10 flex`,
                children: [(0, F.jsx)(`div`, {
                    className: `w-full rounded-card bg-surface-0 md:w-1/2 md:rounded-e-none`
                }), (0, F.jsx)(`div`, {
                    className: c(`hidden rounded-e-[inherit] md:block md:w-1/2`, a ? .rightPanel ? ? `bg-surface-2`)
                })]
            }), (0, F.jsx)(`div`, {
                className: c(`absolute md:hidden`, a ? .closeButton ? ? `right-4 top-4`),
                children: (0, F.jsx)(m.CloseButton, {
                    "aria-label": p
                })
            }), (0, F.jsxs)(`div`, {
                className: `grid grid-cols-1 md:grid-cols-2`,
                children: [(0, F.jsxs)(`div`, {
                    className: c(`flex flex-col justify-between gap-lg`, a ? .contentPanel ? ? `p-xl md:pe-xl`),
                    children: [(0, F.jsxs)(`div`, {
                        className: `flex flex-col gap-md`,
                        children: [e.badgeText && (0, F.jsx)(u, {
                            variant: `accent`,
                            className: `self-start`,
                            children: e.badgeText
                        }), (0, F.jsx)(m.Title, {
                            children: e.title
                        }), e.bodyText && (0, F.jsx)(`p`, {
                            className: `whitespace-pre-line text-body text-secondary`,
                            children: e.bodyText
                        }), e.bulletPoints && e.bulletPoints.length > 0 && (e.numberedSteps ? (0, F.jsx)(`ol`, {
                            role: `list`,
                            className: c(`text-body text-secondary`, a ? .bulletList ? ? `flex flex-col gap-sm`),
                            children: e.bulletPoints.map((e, t) => (0, F.jsxs)(`li`, {
                                className: `flex items-start gap-sm`,
                                children: [(0, F.jsx)(`span`, {
                                    className: `flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-caption-medium text-primary`,
                                    children: t + 1
                                }), (0, F.jsx)(`span`, {
                                    children: e
                                })]
                            }, t))
                        }) : (0, F.jsx)(`ul`, {
                            className: c(`list-disc pl-5 text-body text-secondary`, a ? .bulletList ? ? `flex flex-col gap-sm`),
                            children: e.bulletPoints.map((e, t) => (0, F.jsx)(`li`, {
                                children: e
                            }, t))
                        }))]
                    }), (0, F.jsxs)(`div`, {
                        className: c(`flex flex-col gap-xs`, a ? .ctaContainer),
                        children: [e.ctaCaption && (0, F.jsx)(`p`, {
                            className: `mb-2 text-body text-secondary`,
                            children: f ? (0, F.jsx)(l, {
                                href: f,
                                className: `underline`,
                                children: e.ctaCaption
                            }) : e.ctaCaption
                        }), (0, F.jsx)(o, {
                            variant: `primary`,
                            onClick: t,
                            children: e.ctaText
                        }), (0, F.jsx)(o, {
                            variant: `secondary`,
                            onClick: n,
                            children: e.dismissText ? ? `Later`
                        })]
                    })]
                }), (0, F.jsxs)(`div`, {
                    className: c(`relative hidden items-center justify-center rounded-e-[inherit] md:flex`, a ? .rightPanelContainer ? ? `overflow-hidden`),
                    children: [(0, F.jsx)(s, {
                        src: e.imageUrl,
                        alt: h,
                        width: 600,
                        height: 400,
                        className: `h-full w-full object-cover`
                    }), (0, F.jsx)(`div`, {
                        className: c(`absolute`, a ? .closeButton ? ? `right-4 top-4`),
                        children: (0, F.jsx)(m.CloseButton, {
                            "aria-label": p
                        })
                    })]
                })]
            })]
        })
    });
he.displayName = `SpotlightV1Content`;

function ge({
    href: e,
    className: t,
    children: n
}) {
    return (0, F.jsx)(`a`, {
        href: e,
        target: `_blank`,
        rel: `noopener noreferrer`,
        className: t,
        children: n
    })
}
var L = `Activity.Add.AddCircle.Agent.Alarm.Android.Ant.Apple.Archive.ArrowDown.ArrowDownCircle.ArrowInSquare.ArrowLeft.ArrowLeftCircle.ArrowOutSquare.ArrowReturn.ArrowRight.ArrowRightCircle.ArrowSplitRight.ArrowUp.ArrowUpCircle.ArrowUpRight.ArrowsOut.Artifacts.Atom.Attachment.Batch.Beaker.Binoculars.Book.BookClosed.BookText.Box.BrowseSelect.Bullhorn.Cache.Calendar.Camera.Capacity.CaretDown.CaretDownUp.CaretLeft.CaretRight.CaretUp.CaretUpDown.ChangesPlusMinus.ChangesPlusMinusFilled.Chart.ChartLine.Chat.ChatAdd.ChatAddFilled.ChatDelete.ChatDeleteFilled.ChatFilled.ChatSimple.ChatSimpleFilled.Chats.ChatsFilled.Check.CheckCircle.CheckCircleFilled.CheckDouble.Checklist.ChecklistFilled.Clipboard.ClipboardArrow.Clock.Cloud.CloudFilled.CloudSlash.CloudSlashFilled.Code.CodeBlock.CodeBrackets.CodeFilled.CoffeeCup.Collapse.CommandCard.CommandLine.CommandLineFilled.CommandLinePrompt.Compact.Computer.Concierge.Connectors.Copy.Create.CreditCard.Cursor.CursorFilled.DNA.Database.Disconnect.Dispatch.DollarSign.DotsCircle.DotsHorizontal.DotsVertical.Download.Edit.Email.Evals.Expand.ExtendedThinking.Eye.EyeSlash.Fastforward.File.FileAdd.FileUpload.Files.Filter.Flag.Folder.FolderOpen.FolderPlus.Ghost.GhostFilled.Gift.GitBranch.GitCommit.GitDiff.GitFork.GitMerge.GitMergeConflict.GitMergedSimple.GitPullRequest.GitPullRequestClosed.GitPullRequestDraft.Globe.GraduationCap.Grid.Hand.HandHeart.Haptics.Help.History.Home.ID.Image.Indent.InfoSimple.Info.Interactive.Key.Keyboard.Laptop.LaptopFilled.LaptopSlash.Library.Lightbulb.Lightning.Link.LinkSimple.ListAdd.ListBullet.ListNumbered.Location.LocationQuestionMark.LocationSlash.Lock.LockOpen.LockShield.Logout.Mailbox.MapPin.Mcp.Memory.Mention.Menu.Microphone.MicrophoneFilled.MicrophoneSlash.Minus.MobilePhone.Moon.MoonFilled.MoonStars.Note.Notification.NotificationSlash.Organization.Owl.Palette.PaletteFilled.PaperPlane.Pause.Phone.Pin.PinFilled.PinSlash.Placeholder.Play.PlayCircle.PlayCircleFilled.PlayFilled.Plugin.Press.Pro.Prohibit.Projects.ProjectsFilled.ProjectsX.Prompt.Recording.Reload.Reorder.Research.Screenshare.Scroll.Search.SearchCircle.Select.Settings.Shapes.Share.ShareAndroid.ShareApple.ShieldSearch.Shuffle.Sidebar.SidebarClose.SidebarOpen.Signpost.SlashShortcutCommand.Slides.Sort.Speaker.Spinner.Spreadsheet.Star.StarFilled.StarSlash.Stop.StopCircle.StopFilled.Styles.Sun.SunFilled.SunHorizon.Tasks.Team.Temperature.TemperatureSimple.TextAa.TextBold.TextItalics.TextUnderline.ThumbsDown.ThumbsDownFilled.ThumbsUp.ThumbsUpFilled.Timer.Toggles.Token.Tool.Trash.Trust.Upload.User.UserCircle.Users.Verified.Voice.Warning.WarningCircle.WarningShield.Workspace.Wrench.WrenchFilled.X.XCircle.GitMergeQueue.Orbit.SidebarRight.Refresh.Bluetooth.BluetoothSlash`.split(`.`);

function _e(e) {
    if (!(e === void 0 || !L.includes(e))) return e
}
var {
    entries: ve,
    setPrototypeOf: ye,
    isFrozen: be,
    getPrototypeOf: xe,
    getOwnPropertyDescriptor: Se
} = Object, {
    freeze: R,
    seal: z,
    create: Ce
} = Object, {
    apply: B,
    construct: V
} = typeof Reflect < `u` && Reflect;
R || = function(e) {
    return e
}, z || = function(e) {
    return e
}, B || = function(e, t) {
    var n = [...arguments].slice(2);
    return e.apply(t, n)
}, V || = function(e) {
    return new e(...[...arguments].slice(1))
};
var we = W(Array.prototype.forEach),
    Te = W(Array.prototype.lastIndexOf),
    Ee = W(Array.prototype.pop),
    De = W(Array.prototype.push),
    Oe = W(Array.prototype.splice),
    ke = W(String.prototype.toLowerCase),
    Ae = W(String.prototype.toString),
    je = W(String.prototype.match),
    Me = W(String.prototype.replace),
    Ne = W(String.prototype.indexOf),
    Pe = W(String.prototype.trim),
    H = W(Object.prototype.hasOwnProperty),
    U = W(RegExp.prototype.test),
    Fe = Ie(TypeError);

function W(e) {
    return function(t) {
        t instanceof RegExp && (t.lastIndex = 0);
        var n = [...arguments].slice(1);
        return B(e, t, n)
    }
}

function Ie(e) {
    return function() {
        return V(e, [...arguments])
    }
}

function G(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : ke;
    ye && ye(e, null);
    let r = t.length;
    for (; r--;) {
        let i = t[r];
        if (typeof i == `string`) {
            let e = n(i);
            e !== i && (be(t) || (t[r] = e), i = e)
        }
        e[i] = !0
    }
    return e
}

function Le(e) {
    for (let t = 0; t < e.length; t++) H(e, t) || (e[t] = null);
    return e
}

function K(e) {
    let t = Ce(null);
    for (let [n, r] of ve(e)) H(e, n) && (Array.isArray(r) ? t[n] = Le(r) : r && typeof r == `object` && r.constructor === Object ? t[n] = K(r) : t[n] = r);
    return t
}

function Re(e, t) {
    for (; e !== null;) {
        let n = Se(e, t);
        if (n) {
            if (n.get) return W(n.get);
            if (typeof n.value == `function`) return W(n.value)
        }
        e = xe(e)
    }

    function n() {
        return null
    }
    return n
}
var ze = R(`a.abbr.acronym.address.area.article.aside.audio.b.bdi.bdo.big.blink.blockquote.body.br.button.canvas.caption.center.cite.code.col.colgroup.content.data.datalist.dd.decorator.del.details.dfn.dialog.dir.div.dl.dt.element.em.fieldset.figcaption.figure.font.footer.form.h1.h2.h3.h4.h5.h6.head.header.hgroup.hr.html.i.img.input.ins.kbd.label.legend.li.main.map.mark.marquee.menu.menuitem.meter.nav.nobr.ol.optgroup.option.output.p.picture.pre.progress.q.rp.rt.ruby.s.samp.search.section.select.shadow.slot.small.source.spacer.span.strike.strong.style.sub.summary.sup.table.tbody.td.template.textarea.tfoot.th.thead.time.tr.track.tt.u.ul.var.video.wbr`.split(`.`)),
    Be = R(`svg.a.altglyph.altglyphdef.altglyphitem.animatecolor.animatemotion.animatetransform.circle.clippath.defs.desc.ellipse.enterkeyhint.exportparts.filter.font.g.glyph.glyphref.hkern.image.inputmode.line.lineargradient.marker.mask.metadata.mpath.part.path.pattern.polygon.polyline.radialgradient.rect.stop.style.switch.symbol.text.textpath.title.tref.tspan.view.vkern`.split(`.`)),
    Ve = R([`feBlend`, `feColorMatrix`, `feComponentTransfer`, `feComposite`, `feConvolveMatrix`, `feDiffuseLighting`, `feDisplacementMap`, `feDistantLight`, `feDropShadow`, `feFlood`, `feFuncA`, `feFuncB`, `feFuncG`, `feFuncR`, `feGaussianBlur`, `feImage`, `feMerge`, `feMergeNode`, `feMorphology`, `feOffset`, `fePointLight`, `feSpecularLighting`, `feSpotLight`, `feTile`, `feTurbulence`]),
    He = R([`animate`, `color-profile`, `cursor`, `discard`, `font-face`, `font-face-format`, `font-face-name`, `font-face-src`, `font-face-uri`, `foreignobject`, `hatch`, `hatchpath`, `mesh`, `meshgradient`, `meshpatch`, `meshrow`, `missing-glyph`, `script`, `set`, `solidcolor`, `unknown`, `use`]),
    Ue = R(`math.menclose.merror.mfenced.mfrac.mglyph.mi.mlabeledtr.mmultiscripts.mn.mo.mover.mpadded.mphantom.mroot.mrow.ms.mspace.msqrt.mstyle.msub.msup.msubsup.mtable.mtd.mtext.mtr.munder.munderover.mprescripts`.split(`.`)),
    We = R([`maction`, `maligngroup`, `malignmark`, `mlongdiv`, `mscarries`, `mscarry`, `msgroup`, `mstack`, `msline`, `msrow`, `semantics`, `annotation`, `annotation-xml`, `mprescripts`, `none`]),
    Ge = R([`#text`]),
    Ke = R(`accept.action.align.alt.autocapitalize.autocomplete.autopictureinpicture.autoplay.background.bgcolor.border.capture.cellpadding.cellspacing.checked.cite.class.clear.color.cols.colspan.controls.controlslist.coords.crossorigin.datetime.decoding.default.dir.disabled.disablepictureinpicture.disableremoteplayback.download.draggable.enctype.enterkeyhint.exportparts.face.for.headers.height.hidden.high.href.hreflang.id.inert.inputmode.integrity.ismap.kind.label.lang.list.loading.loop.low.max.maxlength.media.method.min.minlength.multiple.muted.name.nonce.noshade.novalidate.nowrap.open.optimum.part.pattern.placeholder.playsinline.popover.popovertarget.popovertargetaction.poster.preload.pubdate.radiogroup.readonly.rel.required.rev.reversed.role.rows.rowspan.spellcheck.scope.selected.shape.size.sizes.slot.span.srclang.start.src.srcset.step.style.summary.tabindex.title.translate.type.usemap.valign.value.width.wrap.xmlns.slot`.split(`.`)),
    qe = R(`accent-height.accumulate.additive.alignment-baseline.amplitude.ascent.attributename.attributetype.azimuth.basefrequency.baseline-shift.begin.bias.by.class.clip.clippathunits.clip-path.clip-rule.color.color-interpolation.color-interpolation-filters.color-profile.color-rendering.cx.cy.d.dx.dy.diffuseconstant.direction.display.divisor.dur.edgemode.elevation.end.exponent.fill.fill-opacity.fill-rule.filter.filterunits.flood-color.flood-opacity.font-family.font-size.font-size-adjust.font-stretch.font-style.font-variant.font-weight.fx.fy.g1.g2.glyph-name.glyphref.gradientunits.gradienttransform.height.href.id.image-rendering.in.in2.intercept.k.k1.k2.k3.k4.kerning.keypoints.keysplines.keytimes.lang.lengthadjust.letter-spacing.kernelmatrix.kernelunitlength.lighting-color.local.marker-end.marker-mid.marker-start.markerheight.markerunits.markerwidth.maskcontentunits.maskunits.max.mask.mask-type.media.method.mode.min.name.numoctaves.offset.operator.opacity.order.orient.orientation.origin.overflow.paint-order.path.pathlength.patterncontentunits.patterntransform.patternunits.points.preservealpha.preserveaspectratio.primitiveunits.r.rx.ry.radius.refx.refy.repeatcount.repeatdur.restart.result.rotate.scale.seed.shape-rendering.slope.specularconstant.specularexponent.spreadmethod.startoffset.stddeviation.stitchtiles.stop-color.stop-opacity.stroke-dasharray.stroke-dashoffset.strokeLinecap.strokeLinejoin.stroke-miterlimit.stroke-opacity.stroke.stroke-width.style.surfacescale.systemlanguage.tabindex.tablevalues.targetx.targety.transform.transform-origin.text-anchor.text-decoration.text-rendering.textlength.type.u1.u2.unicode.values.viewbox.visibility.version.vert-adv-y.vert-origin-x.vert-origin-y.width.word-spacing.wrap.writing-mode.xchannelselector.ychannelselector.x.x1.x2.xmlns.y.y1.y2.z.zoomandpan`.split(`.`)),
    Je = R(`accent.accentunder.align.bevelled.close.columnalign.columnlines.columnspacing.columnspan.denomalign.depth.dir.display.displaystyle.encoding.fence.frame.height.href.id.largeop.length.linethickness.lquote.lspace.mathbackground.mathcolor.mathsize.mathvariant.maxsize.minsize.movablelimits.notation.numalign.open.rowalign.rowlines.rowspacing.rowspan.rspace.rquote.scriptlevel.scriptminsize.scriptsizemultiplier.selection.separator.separators.stretchy.subscriptshift.supscriptshift.symmetric.voffset.width.xmlns`.split(`.`)),
    Ye = R([`xlink:href`, `xml:id`, `xlink:title`, `xml:space`, `xmlns:xlink`]),
    Xe = z(/\{\{[\w\W]*|[\w\W]*\}\}/gm),
    Ze = z(/<%[\w\W]*|[\w\W]*%>/gm),
    Qe = z(/\$\{[\w\W]*/gm),
    $e = z(/^data-[\-\w.\u00B7-\uFFFF]+$/),
    q = z(/^aria-[\-\w]+$/),
    et = z(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),
    J = z(/^(?:\w+script|data):/i),
    tt = z(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),
    nt = z(/^html$/i),
    rt = z(/^[a-z][.\w]*(-[.\w]+)+$/i),
    it = Object.freeze({
        __proto__: null,
        ARIA_ATTR: q,
        ATTR_WHITESPACE: tt,
        CUSTOM_ELEMENT: rt,
        DATA_ATTR: $e,
        DOCTYPE_NAME: nt,
        ERB_EXPR: Ze,
        IS_ALLOWED_URI: et,
        IS_SCRIPT_OR_DATA: J,
        MUSTACHE_EXPR: Xe,
        TMPLIT_EXPR: Qe
    }),
    at = {
        element: 1,
        text: 3,
        progressingInstruction: 7,
        comment: 8,
        document: 9
    },
    ot = function() {
        return typeof window > `u` ? null : window
    },
    st = function(e, t) {
        if (typeof e != `object` || typeof e.createPolicy != `function`) return null;
        let n = null,
            r = `data-tt-policy-suffix`;
        t && t.hasAttribute(r) && (n = t.getAttribute(r));
        let i = `dompurify` + (n ? `#` + n : ``);
        try {
            return e.createPolicy(i, {
                createHTML(e) {
                    return e
                },
                createScriptURL(e) {
                    return e
                }
            })
        } catch {
            return null
        }
    },
    ct = function() {
        return {
            afterSanitizeAttributes: [],
            afterSanitizeElements: [],
            afterSanitizeShadowDOM: [],
            beforeSanitizeAttributes: [],
            beforeSanitizeElements: [],
            beforeSanitizeShadowDOM: [],
            uponSanitizeAttribute: [],
            uponSanitizeElement: [],
            uponSanitizeShadowNode: []
        }
    };

function lt() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : ot(),
        t = e => lt(e);
    if (t.version = `3.4.0`, t.removed = [], !e || !e.document || e.document.nodeType !== at.document || !e.Element) return t.isSupported = !1, t;
    let {
        document: n
    } = e, r = n, i = r.currentScript, {
        DocumentFragment: a,
        HTMLTemplateElement: o,
        Node: s,
        Element: c,
        NodeFilter: l,
        NamedNodeMap: u = e.NamedNodeMap || e.MozNamedAttrMap,
        HTMLFormElement: d,
        DOMParser: f,
        trustedTypes: p
    } = e, m = c.prototype, h = Re(m, `cloneNode`), g = Re(m, `remove`), _ = Re(m, `nextSibling`), v = Re(m, `childNodes`), y = Re(m, `parentNode`);
    if (typeof o == `function`) {
        let e = n.createElement(`template`);
        e.content && e.content.ownerDocument && (n = e.content.ownerDocument)
    }
    let b, x = ``,
        {
            implementation: S,
            createNodeIterator: C,
            createDocumentFragment: w,
            getElementsByTagName: T
        } = n,
        {
            importNode: ee
        } = r,
        E = ct();
    t.isSupported = typeof ve == `function` && typeof y == `function` && S && S.createHTMLDocument !== void 0;
    let {
        MUSTACHE_EXPR: te,
        ERB_EXPR: D,
        TMPLIT_EXPR: O,
        DATA_ATTR: ne,
        ARIA_ATTR: re,
        IS_SCRIPT_OR_DATA: ie,
        ATTR_WHITESPACE: ae,
        CUSTOM_ELEMENT: oe
    } = it, {
        IS_ALLOWED_URI: se
    } = it, k = null, ce = G({}, [...ze, ...Be, ...Ve, ...Ue, ...Ge]), A = null, le = G({}, [...Ke, ...qe, ...Je, ...Ye]), j = Object.seal(Ce(null, {
        tagNameCheck: {
            writable: !0,
            configurable: !1,
            enumerable: !0,
            value: null
        },
        attributeNameCheck: {
            writable: !0,
            configurable: !1,
            enumerable: !0,
            value: null
        },
        allowCustomizedBuiltInElements: {
            writable: !0,
            configurable: !1,
            enumerable: !0,
            value: !1
        }
    })), M = null, ue = null, N = Object.seal(Ce(null, {
        tagCheck: {
            writable: !0,
            configurable: !1,
            enumerable: !0,
            value: null
        },
        attributeCheck: {
            writable: !0,
            configurable: !1,
            enumerable: !0,
            value: null
        }
    })), de = !0, fe = !0, pe = !1, me = !0, P = !1, F = !0, I = !1, he = !1, ge = !1, L = !1, _e = !1, ye = !1, be = !0, xe = !1, Se = !0, z = !1, B = {}, V = null, W = G({}, [`annotation-xml`, `audio`, `colgroup`, `desc`, `foreignobject`, `head`, `iframe`, `math`, `mi`, `mn`, `mo`, `ms`, `mtext`, `noembed`, `noframes`, `noscript`, `plaintext`, `script`, `style`, `svg`, `template`, `thead`, `title`, `video`, `xmp`]), Ie = null, Le = G({}, [`audio`, `video`, `img`, `source`, `image`, `track`]), Xe = null, Ze = G({}, [`alt`, `class`, `for`, `id`, `label`, `name`, `pattern`, `placeholder`, `role`, `summary`, `title`, `value`, `style`, `xmlns`]), Qe = `http://www.w3.org/1998/Math/MathML`, $e = `http://www.w3.org/2000/svg`, q = `http://www.w3.org/1999/xhtml`, J = q, tt = !1, rt = null, ut = G({}, [Qe, $e, q], Ae), dt = G({}, [`mi`, `mo`, `mn`, `ms`, `mtext`]), ft = G({}, [`annotation-xml`]), pt = G({}, [`title`, `style`, `font`, `a`, `script`]), mt = null, ht = [`application/xhtml+xml`, `text/html`], Y = null, X = null, gt = n.createElement(`form`), _t = function(e) {
        return e instanceof RegExp || e instanceof Function
    }, vt = function() {
        let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        if (!(X && X === e)) {
            if ((!e || typeof e != `object`) && (e = {}), e = K(e), mt = ht.indexOf(e.PARSER_MEDIA_TYPE) === -1 ? `text/html` : e.PARSER_MEDIA_TYPE, Y = mt === `application/xhtml+xml` ? Ae : ke, k = H(e, `ALLOWED_TAGS`) ? G({}, e.ALLOWED_TAGS, Y) : ce, A = H(e, `ALLOWED_ATTR`) ? G({}, e.ALLOWED_ATTR, Y) : le, rt = H(e, `ALLOWED_NAMESPACES`) ? G({}, e.ALLOWED_NAMESPACES, Ae) : ut, Xe = H(e, `ADD_URI_SAFE_ATTR`) ? G(K(Ze), e.ADD_URI_SAFE_ATTR, Y) : Ze, Ie = H(e, `ADD_DATA_URI_TAGS`) ? G(K(Le), e.ADD_DATA_URI_TAGS, Y) : Le, V = H(e, `FORBID_CONTENTS`) ? G({}, e.FORBID_CONTENTS, Y) : W, M = H(e, `FORBID_TAGS`) ? G({}, e.FORBID_TAGS, Y) : K({}), ue = H(e, `FORBID_ATTR`) ? G({}, e.FORBID_ATTR, Y) : K({}), B = H(e, `USE_PROFILES`) ? e.USE_PROFILES : !1, de = e.ALLOW_ARIA_ATTR !== !1, fe = e.ALLOW_DATA_ATTR !== !1, pe = e.ALLOW_UNKNOWN_PROTOCOLS || !1, me = e.ALLOW_SELF_CLOSE_IN_ATTR !== !1, P = e.SAFE_FOR_TEMPLATES || !1, F = e.SAFE_FOR_XML !== !1, I = e.WHOLE_DOCUMENT || !1, L = e.RETURN_DOM || !1, _e = e.RETURN_DOM_FRAGMENT || !1, ye = e.RETURN_TRUSTED_TYPE || !1, ge = e.FORCE_BODY || !1, be = e.SANITIZE_DOM !== !1, xe = e.SANITIZE_NAMED_PROPS || !1, Se = e.KEEP_CONTENT !== !1, z = e.IN_PLACE || !1, se = e.ALLOWED_URI_REGEXP || et, J = e.NAMESPACE || q, dt = e.MATHML_TEXT_INTEGRATION_POINTS || dt, ft = e.HTML_INTEGRATION_POINTS || ft, j = e.CUSTOM_ELEMENT_HANDLING || Ce(null), e.CUSTOM_ELEMENT_HANDLING && _t(e.CUSTOM_ELEMENT_HANDLING.tagNameCheck) && (j.tagNameCheck = e.CUSTOM_ELEMENT_HANDLING.tagNameCheck), e.CUSTOM_ELEMENT_HANDLING && _t(e.CUSTOM_ELEMENT_HANDLING.attributeNameCheck) && (j.attributeNameCheck = e.CUSTOM_ELEMENT_HANDLING.attributeNameCheck), e.CUSTOM_ELEMENT_HANDLING && typeof e.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements == `boolean` && (j.allowCustomizedBuiltInElements = e.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements), P && (fe = !1), _e && (L = !0), B && (k = G({}, Ge), A = Ce(null), B.html === !0 && (G(k, ze), G(A, Ke)), B.svg === !0 && (G(k, Be), G(A, qe), G(A, Ye)), B.svgFilters === !0 && (G(k, Ve), G(A, qe), G(A, Ye)), B.mathMl === !0 && (G(k, Ue), G(A, Je), G(A, Ye))), N.tagCheck = null, N.attributeCheck = null, e.ADD_TAGS && (typeof e.ADD_TAGS == `function` ? N.tagCheck = e.ADD_TAGS : (k === ce && (k = K(k)), G(k, e.ADD_TAGS, Y))), e.ADD_ATTR && (typeof e.ADD_ATTR == `function` ? N.attributeCheck = e.ADD_ATTR : (A === le && (A = K(A)), G(A, e.ADD_ATTR, Y))), e.ADD_URI_SAFE_ATTR && G(Xe, e.ADD_URI_SAFE_ATTR, Y), e.FORBID_CONTENTS && (V === W && (V = K(V)), G(V, e.FORBID_CONTENTS, Y)), e.ADD_FORBID_CONTENTS && (V === W && (V = K(V)), G(V, e.ADD_FORBID_CONTENTS, Y)), Se && (k[`#text`] = !0), I && G(k, [`html`, `head`, `body`]), k.table && (G(k, [`tbody`]), delete M.tbody), e.TRUSTED_TYPES_POLICY) {
                if (typeof e.TRUSTED_TYPES_POLICY.createHTML != `function`) throw Fe(`TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.`);
                if (typeof e.TRUSTED_TYPES_POLICY.createScriptURL != `function`) throw Fe(`TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.`);
                b = e.TRUSTED_TYPES_POLICY, x = b.createHTML(``)
            } else b === void 0 && (b = st(p, i)), b !== null && typeof x == `string` && (x = b.createHTML(``));
            R && R(e), X = e
        }
    }, yt = G({}, [...Be, ...Ve, ...He]), bt = G({}, [...Ue, ...We]), xt = function(e) {
        let t = y(e);
        (!t || !t.tagName) && (t = {
            namespaceURI: J,
            tagName: `template`
        });
        let n = ke(e.tagName),
            r = ke(t.tagName);
        return rt[e.namespaceURI] ? e.namespaceURI === $e ? t.namespaceURI === q ? n === `svg` : t.namespaceURI === Qe ? n === `svg` && (r === `annotation-xml` || dt[r]) : !!yt[n] : e.namespaceURI === Qe ? t.namespaceURI === q ? n === `math` : t.namespaceURI === $e ? n === `math` && ft[r] : !!bt[n] : e.namespaceURI === q ? t.namespaceURI === $e && !ft[r] || t.namespaceURI === Qe && !dt[r] ? !1 : !bt[n] && (pt[n] || !yt[n]) : !!(mt === `application/xhtml+xml` && rt[e.namespaceURI]) : !1
    }, Z = function(e) {
        De(t.removed, {
            element: e
        });
        try {
            y(e).removeChild(e)
        } catch {
            g(e)
        }
    }, Q = function(e, n) {
        try {
            De(t.removed, {
                attribute: n.getAttributeNode(e),
                from: n
            })
        } catch {
            De(t.removed, {
                attribute: null,
                from: n
            })
        }
        if (n.removeAttribute(e), e === `is`)
            if (L || _e) try {
                Z(n)
            } catch {} else try {
                n.setAttribute(e, ``)
            } catch {}
    }, St = function(e) {
        let t = null,
            r = null;
        if (ge) e = `<remove></remove>` + e;
        else {
            let t = je(e, /^[\r\n\t ]+/);
            r = t && t[0]
        }
        mt === `application/xhtml+xml` && J === q && (e = `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>` + e + `</body></html>`);
        let i = b ? b.createHTML(e) : e;
        if (J === q) try {
            t = new f().parseFromString(i, mt)
        } catch {}
        if (!t || !t.documentElement) {
            t = S.createDocument(J, `template`, null);
            try {
                t.documentElement.innerHTML = tt ? x : i
            } catch {}
        }
        let a = t.body || t.documentElement;
        return e && r && a.insertBefore(n.createTextNode(r), a.childNodes[0] || null), J === q ? T.call(t, I ? `html` : `body`)[0] : I ? t.documentElement : a
    }, Ct = function(e) {
        return C.call(e.ownerDocument || e, e, l.SHOW_ELEMENT | l.SHOW_COMMENT | l.SHOW_TEXT | l.SHOW_PROCESSING_INSTRUCTION | l.SHOW_CDATA_SECTION, null)
    }, wt = function(e) {
        return e instanceof d && (typeof e.nodeName != `string` || typeof e.textContent != `string` || typeof e.removeChild != `function` || !(e.attributes instanceof u) || typeof e.removeAttribute != `function` || typeof e.setAttribute != `function` || typeof e.namespaceURI != `string` || typeof e.insertBefore != `function` || typeof e.hasChildNodes != `function`)
    }, Tt = function(e) {
        return typeof s == `function` && e instanceof s
    };

    function $(e, n, r) {
        we(e, e => {
            e.call(t, n, r, X)
        })
    }
    let Et = function(e) {
            let n = null;
            if ($(E.beforeSanitizeElements, e, null), wt(e)) return Z(e), !0;
            let r = Y(e.nodeName);
            if ($(E.uponSanitizeElement, e, {
                    tagName: r,
                    allowedTags: k
                }), F && e.hasChildNodes() && !Tt(e.firstElementChild) && U(/<[/\w!]/g, e.innerHTML) && U(/<[/\w!]/g, e.textContent) || F && e.namespaceURI === q && r === `style` && Tt(e.firstElementChild) || e.nodeType === at.progressingInstruction || F && e.nodeType === at.comment && U(/<[/\w]/g, e.data)) return Z(e), !0;
            if (M[r] || !(N.tagCheck instanceof Function && N.tagCheck(r)) && !k[r]) {
                if (!M[r] && Ot(r) && (j.tagNameCheck instanceof RegExp && U(j.tagNameCheck, r) || j.tagNameCheck instanceof Function && j.tagNameCheck(r))) return !1;
                if (Se && !V[r]) {
                    let t = y(e) || e.parentNode,
                        n = v(e) || e.childNodes;
                    if (n && t) {
                        let r = n.length;
                        for (let i = r - 1; i >= 0; --i) {
                            let r = h(n[i], !0);
                            r.__removalCount = (e.__removalCount || 0) + 1, t.insertBefore(r, _(e))
                        }
                    }
                }
                return Z(e), !0
            }
            return e instanceof c && !xt(e) || (r === `noscript` || r === `noembed` || r === `noframes`) && U(/<\/no(script|embed|frames)/i, e.innerHTML) ? (Z(e), !0) : (P && e.nodeType === at.text && (n = e.textContent, we([te, D, O], e => {
                n = Me(n, e, ` `)
            }), e.textContent !== n && (De(t.removed, {
                element: e.cloneNode()
            }), e.textContent = n)), $(E.afterSanitizeElements, e, null), !1)
        },
        Dt = function(e, t, r) {
            if (ue[t] || be && (t === `id` || t === `name`) && (r in n || r in gt)) return !1;
            if (!(fe && !ue[t] && U(ne, t)) && !(de && U(re, t)) && !(N.attributeCheck instanceof Function && N.attributeCheck(t, e))) {
                if (!A[t] || ue[t]) {
                    if (!(Ot(e) && (j.tagNameCheck instanceof RegExp && U(j.tagNameCheck, e) || j.tagNameCheck instanceof Function && j.tagNameCheck(e)) && (j.attributeNameCheck instanceof RegExp && U(j.attributeNameCheck, t) || j.attributeNameCheck instanceof Function && j.attributeNameCheck(t, e)) || t === `is` && j.allowCustomizedBuiltInElements && (j.tagNameCheck instanceof RegExp && U(j.tagNameCheck, r) || j.tagNameCheck instanceof Function && j.tagNameCheck(r)))) return !1
                } else if (!Xe[t] && !U(se, Me(r, ae, ``)) && !((t === `src` || t === `xlink:href` || t === `href`) && e !== `script` && Ne(r, `data:`) === 0 && Ie[e]) && !(pe && !U(ie, Me(r, ae, ``))) && r) return !1
            }
            return !0
        },
        Ot = function(e) {
            return e !== `annotation-xml` && je(e, oe)
        },
        kt = function(e) {
            $(E.beforeSanitizeAttributes, e, null);
            let {
                attributes: n
            } = e;
            if (!n || wt(e)) return;
            let r = {
                    attrName: ``,
                    attrValue: ``,
                    keepAttr: !0,
                    allowedAttributes: A,
                    forceKeepAttr: void 0
                },
                i = n.length;
            for (; i--;) {
                let {
                    name: a,
                    namespaceURI: o,
                    value: s
                } = n[i], c = Y(a), l = s, u = a === `value` ? l : Pe(l);
                if (r.attrName = c, r.attrValue = u, r.keepAttr = !0, r.forceKeepAttr = void 0, $(E.uponSanitizeAttribute, e, r), u = r.attrValue, xe && (c === `id` || c === `name`) && (Q(a, e), u = `user-content-` + u), F && U(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, u)) {
                    Q(a, e);
                    continue
                }
                if (c === `attributename` && je(u, `href`)) {
                    Q(a, e);
                    continue
                }
                if (r.forceKeepAttr) continue;
                if (!r.keepAttr) {
                    Q(a, e);
                    continue
                }
                if (!me && U(/\/>/i, u)) {
                    Q(a, e);
                    continue
                }
                P && we([te, D, O], e => {
                    u = Me(u, e, ` `)
                });
                let d = Y(e.nodeName);
                if (!Dt(d, c, u)) {
                    Q(a, e);
                    continue
                }
                if (b && typeof p == `object` && typeof p.getAttributeType == `function` && !o) switch (p.getAttributeType(d, c)) {
                    case `TrustedHTML`:
                        u = b.createHTML(u);
                        break;
                    case `TrustedScriptURL`:
                        u = b.createScriptURL(u);
                        break
                }
                if (u !== l) try {
                    o ? e.setAttributeNS(o, a, u) : e.setAttribute(a, u), wt(e) ? Z(e) : Ee(t.removed)
                } catch {
                    Q(a, e)
                }
            }
            $(E.afterSanitizeAttributes, e, null)
        },
        At = function(e) {
            let t = null,
                n = Ct(e);
            for ($(E.beforeSanitizeShadowDOM, e, null); t = n.nextNode();) $(E.uponSanitizeShadowNode, t, null), Et(t), kt(t), t.content instanceof a && At(t.content);
            $(E.afterSanitizeShadowDOM, e, null)
        };
    return t.sanitize = function(e) {
        let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
            i = null,
            o = null,
            c = null,
            l = null;
        if (tt = !e, tt && (e = `<!-->`), typeof e != `string` && !Tt(e))
            if (typeof e.toString == `function`) {
                if (e = e.toString(), typeof e != `string`) throw Fe(`dirty is not a string, aborting`)
            } else throw Fe(`toString is not a function`);
        if (!t.isSupported) return e;
        if (he || vt(n), t.removed = [], typeof e == `string` && (z = !1), z) {
            if (e.nodeName) {
                let t = Y(e.nodeName);
                if (!k[t] || M[t]) throw Fe(`root node is forbidden and cannot be sanitized in-place`)
            }
        } else if (e instanceof s) i = St(`<!---->`), o = i.ownerDocument.importNode(e, !0), o.nodeType === at.element && o.nodeName === `BODY` || o.nodeName === `HTML` ? i = o : i.appendChild(o);
        else {
            if (!L && !P && !I && e.indexOf(`<`) === -1) return b && ye ? b.createHTML(e) : e;
            if (i = St(e), !i) return L ? null : ye ? x : ``
        }
        i && ge && Z(i.firstChild);
        let u = Ct(z ? e : i);
        for (; c = u.nextNode();) Et(c), kt(c), c.content instanceof a && At(c.content);
        if (z) return e;
        if (L) {
            if (P) {
                i.normalize();
                let e = i.innerHTML;
                we([te, D, O], t => {
                    e = Me(e, t, ` `)
                }), i.innerHTML = e
            }
            if (_e)
                for (l = w.call(i.ownerDocument); i.firstChild;) l.appendChild(i.firstChild);
            else l = i;
            return (A.shadowroot || A.shadowrootmode) && (l = ee.call(r, l, !0)), l
        }
        let d = I ? i.outerHTML : i.innerHTML;
        return I && k[`!doctype`] && i.ownerDocument && i.ownerDocument.doctype && i.ownerDocument.doctype.name && U(nt, i.ownerDocument.doctype.name) && (d = `<!DOCTYPE ` + i.ownerDocument.doctype.name + `>
` + d), P && we([te, D, O], e => {
            d = Me(d, e, ` `)
        }), b && ye ? b.createHTML(d) : d
    }, t.setConfig = function() {
        vt(arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}), he = !0
    }, t.clearConfig = function() {
        X = null, he = !1
    }, t.isValidAttribute = function(e, t, n) {
        return X || vt({}), Dt(Y(e), Y(t), n)
    }, t.addHook = function(e, t) {
        typeof t == `function` && De(E[e], t)
    }, t.removeHook = function(e, t) {
        if (t !== void 0) {
            let n = Te(E[e], t);
            return n === -1 ? void 0 : Oe(E[e], n, 1)[0]
        }
        return Ee(E[e])
    }, t.removeHooks = function(e) {
        E[e] = []
    }, t.removeAllHooks = function() {
        E = ct()
    }, t
}
var ut = lt(),
    dt = [`a`, `b`, `strong`, `i`, `em`, `u`, `br`, `span`, `p`],
    ft = [`href`, `target`],
    pt = typeof window > `u` ? null : ut(window);
pt ? .addHook(`afterSanitizeAttributes`, e => {
    e.tagName === `A` && e.hasAttribute(`target`) && e.setAttribute(`rel`, `noopener noreferrer`)
});

function mt(e) {
    return pt ? .isSupported ? pt.sanitize(e, {
        ALLOWED_TAGS: dt,
        ALLOWED_ATTR: ft
    }) : ``
}

function ht(e) {
    if (!pt ? .isSupported || typeof document > `u`) return ``;
    let t = pt.sanitize(e.replace(/<\/?(?:br|p)\b[^>]*>/gi, ` `), {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
        }),
        n = document.createElement(`div`);
    return n.innerHTML = t, (n.textContent ? ? ``).replace(/\s+/g, ` `).trim()
}
var Y = (0, I.forwardRef)(({
    asset: e,
    ...t
}, n) => {
    let r = (0, I.useId)(),
        {
            resolvedMode: i,
            mounted: a
        } = E()();
    if (!a && e.sources.every(e => e.theme !== void 0)) return null;
    let o = a ? i : void 0,
        s = o === void 0 ? e.sources : e.sources.filter(e => e.theme === void 0 || e.theme === o),
        c = s.length > 0 ? s : e.sources,
        l = c.map(e => e.url).join(`|`),
        {
            onError: u,
            ...d
        } = t,
        f = c.length - 1,
        p = c.map((e, t) => (0, F.jsx)(`source`, {
            src: e.url,
            type: e.type,
            onError: t === f ? u : void 0
        }, e.url));
    if (e.decorative) return (0, F.jsx)(`video`, {
        ref: n,
        "aria-hidden": d[`aria-label`] || d[`aria-labelledby`] ? void 0 : !0,
        tabIndex: -1,
        ...d,
        onError: u,
        children: p
    }, l);
    let m = e.audioDescription,
        h = [m.kind === `transcript` ? r : void 0, d[`aria-describedby`]].filter(Boolean).join(` `) || void 0;
    return (0, F.jsxs)(F.Fragment, {
        children: [(0, F.jsxs)(`video`, {
            ref: n,
            ...d,
            crossOrigin: `anonymous`,
            "aria-describedby": h,
            onError: u,
            children: [p, e.captions.map(e => (0, F.jsx)(`track`, {
                kind: `captions`,
                src: e.url,
                srcLang: e.lang,
                label: e.label
            }, e.url)), m.kind === `track` && (0, F.jsx)(`track`, {
                kind: `captions`,
                src: m.url,
                srcLang: m.lang,
                label: `Audio Description`
            })]
        }, l), m.kind === `transcript` && (0, F.jsx)(`p`, {
            id: r,
            lang: m.lang,
            className: `sr-only`,
            children: m.text
        })]
    })
});
Y.displayName = `Video`;

function X({
    content: e,
    bulletListClassName: t,
    toggleState: n
}) {
    let r = !!e.bulletPoints && e.bulletPoints.length > 0,
        i = !!n && n.resolved.bulletIndex === null,
        a = e.bullets_style === `card` && (r || i);
    return (0, F.jsxs)(F.Fragment, {
        children: [e.badgeText && (0, F.jsx)(u, {
            size: `sm`,
            variant: `accent`,
            className: `self-start`,
            children: e.badgeText
        }), (0, F.jsxs)(`div`, {
            className: `flex flex-col gap-sm`,
            children: [(0, F.jsx)(m.Title, {
                className: `m-0 font-voice text-[28px] leading-tight`,
                children: e.title
            }), e.bodyText && (0, F.jsx)(`p`, {
                className: `m-0 whitespace-pre-line text-body text-secondary`,
                children: e.bodyText
            })]
        }), (0, F.jsxs)(_t, {
            isCard: a,
            children: [r && (0, F.jsx)(bt, {
                points: e.bulletPoints,
                style: e.bullets_style,
                className: t,
                toggleState: n
            }), i && (0, F.jsxs)(`div`, {
                className: c(gt, `items-center`),
                children: [(0, F.jsx)(`span`, {
                    className: `text-body text-secondary`,
                    children: n.resolved.toggle.label
                }), (0, F.jsx)(vt, {
                    toggleState: n,
                    ariaLabel: n.resolved.toggle.label ? .trim() || e.title
                })]
            })]
        })]
    })
}
var gt = `flex gap-md px-lg py-md`;

function _t({
    isCard: e,
    children: t
}) {
    return e ? (0, F.jsx)(`div`, {
        className: `divide-y rounded-card border`,
        children: t
    }) : (0, F.jsx)(F.Fragment, {
        children: t
    })
}

function vt({
    toggleState: e,
    ariaLabel: t
}) {
    return (0, F.jsx)(h, {
        checked: e.value,
        onCheckedChange: e.onChange,
        disabled: e.disabled,
        "aria-label": t,
        className: `ms-auto shrink-0`
    })
}

function yt({
    asset: e,
    ariaLabel: t,
    className: n,
    showControls: r,
    onError: i
}) {
    let [a, o] = (0, I.useState)(!1), s = r && !e.decorative, c = s && !a ? () => o(!0) : void 0;
    return (0, F.jsx)(Y, {
        asset: e,
        className: n,
        autoPlay: !0,
        muted: !0,
        loop: !0,
        playsInline: !0,
        controls: s && a,
        tabIndex: s ? 0 : void 0,
        "aria-label": e.decorative ? void 0 : t,
        onPointerEnter: c,
        onFocus: c,
        onError: i
    }, e.id)
}

function bt({
    points: e,
    style: t,
    className: n,
    toggleState: r
}) {
    let i = t === `card`,
        a = t === `icons`,
        o = (0, I.useMemo)(() => i ? e.map(e => mt(e.text)) : null, [i, e]);
    return (0, F.jsx)(`ul`, {
        role: `list`,
        className: c(`m-0 list-none p-0`, n ? ? (i ? `divide-y` : a ? `flex flex-col` : `flex flex-col gap-sm`)),
        children: e.map((e, t) => {
            let n = _e(e.icon),
                l = r ? .resolved.bulletIndex === t;
            return a ? (0, F.jsxs)(`li`, {
                className: `flex items-center gap-3 py-3`,
                children: [n ? (0, F.jsx)(s, {
                    name: n,
                    className: `shrink-0`
                }) : (0, F.jsx)(`span`, {
                    className: `w-5 shrink-0`
                }), (0, F.jsxs)(`span`, {
                    className: `flex min-w-0 flex-1 flex-col gap-1`,
                    children: [e.title && (0, F.jsx)(`span`, {
                        className: `text-heading font-semibold text-primary`,
                        children: e.title
                    }), (0, F.jsx)(`span`, {
                        className: `text-body text-secondary`,
                        children: e.text
                    })]
                })]
            }, t) : (0, F.jsxs)(`li`, {
                className: c(`text-body text-secondary`, i ? c(gt, `items-start`) : n ? `flex items-start gap-md` : `flex items-start gap-sm`),
                children: [n ? (0, F.jsx)(s, {
                    name: n,
                    className: `mt-0.5 shrink-0`
                }) : !i && (0, F.jsx)(`span`, {
                    className: `shrink-0`,
                    children: `•`
                }), i ? (0, F.jsxs)(`span`, {
                    className: `flex min-w-0 flex-1 flex-col`,
                    children: [e.title && (0, F.jsx)(`span`, {
                        className: `font-bold text-primary`,
                        children: e.title
                    }), (0, F.jsx)(`span`, {
                        className: c(`[&_a]:underline [&_a]:underline-offset-[3px]`, `[&_b]:text-primary [&_strong]:text-primary`, `[&_b]:block [&_b]:mb-0.5 [&_strong]:block [&_strong]:mb-0.5`, `[&_b+br]:hidden [&_strong+br]:hidden [&_br+br]:hidden`, `[&_p]:m-0`),
                        dangerouslySetInnerHTML: {
                            __html: o ? .[t] ? ? ``
                        }
                    })]
                }) : (0, F.jsx)(`span`, {
                    children: e.text
                }), l && (0, F.jsx)(vt, {
                    toggleState: r,
                    ariaLabel: r.resolved.toggle.label ? .trim() || e.title ? .trim() || ht(e.text)
                })]
            }, t)
        })
    })
}
var xt = (0, I.memo)(({
    content: e,
    videoAsset: t,
    onCtaClick: n,
    onToggleChange: r,
    onDismiss: i,
    ctaDisabled: a,
    isDarkMode: s,
    ImageComponent: l,
    classNames: u
}) => {
    let d = l ? ? `img`,
        f = te()(),
        p = (0, I.useMemo)(() => P(e), [e]),
        h = p ? `${p.bulletIndex??`content`}:${p.toggle.param_key||`value`}` : null,
        g = p ? `${h}:${p.toggle.default_value??!1}` : null,
        _ = (0, I.useRef)(null),
        [v, y] = (0, I.useState)(p ? .toggle.default_value ? ? !1),
        [b, x] = (0, I.useState)(g);
    g !== b && (x(g), _.current !== h && y(p ? .toggle.default_value ? ? !1));
    let [S, C] = (0, I.useState)(!1), w = (0, I.useCallback)(async e => {
        if (!p) return;
        _.current = h, y(e);
        let t = r ? .({
            [p.toggle.param_key || `value`]: e
        });
        if (t) {
            C(!0);
            try {
                await t === !1 && y(!e)
            } finally {
                C(!1)
            }
        }
    }, [p, h, r]), T = (0, I.useMemo)(() => p ? {
        resolved: p,
        value: v,
        onChange: w,
        disabled: a || S
    } : void 0, [p, v, w, a, S]), ee = (0, I.useMemo)(() => p ? {
        toggleParams: {
            [p.toggle.param_key || `value`]: v
        }
    } : void 0, [p, v]), E = f({
        defaultMessage: `Close`,
        id: `rbrahOGMC3`
    }), D = e.assetAlt ? ? e.title, O = e.ctaActions.findIndex(e => e.isPrimary), ne = O >= 0 ? O : e.ctaActions.length > 0 ? 0 : -1, re = s && e.darkAssetUrl ? e.darkAssetUrl : e.assetUrl, ie = (0, I.useMemo)(() => {
        if (t) return t;
        if (!e.videoUrl) return;
        let n = (/\.(\w+)(?:[?#]|$)/.exec(e.videoUrl) ? .[1]) ? .toLowerCase();
        return {
            id: `spotlight-remote-video`,
            decorative: !0,
            sources: [{
                url: e.videoUrl,
                type: n === `webm` ? `video/webm` : `video/mp4`
            }]
        }
    }, [t, e.videoUrl]), [ae, oe] = (0, I.useState)(), se = !t && e.videoUrl !== void 0 && e.videoUrl === ae ? void 0 : ie, k = se !== void 0, ce = t ? void 0 : () => oe(e.videoUrl), A = !!(t || e.assetUrl || e.videoUrl), le = u ? .rightPanel ? ? `bg-surface-0`, j = (0, F.jsx)(`div`, {
        className: c(`absolute`, u ? .closeButton ? ? `right-4 top-4`),
        children: (0, F.jsx)(m.CloseButton, {
            "aria-label": E,
            className: `bg-surface-1 hover:bg-surface-3`
        })
    }), M = {
        maxWidth: e.maxWidth !== void 0 && e.maxWidth > 0 ? e.maxWidth : 786
    };
    return e.layout === `vertical` ? (0, F.jsxs)(`div`, {
        className: `relative flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-card bg-surface-0`,
        style: M,
        children: [A ? (0, F.jsxs)(`div`, {
            className: c(`relative aspect-video w-full overflow-hidden`, le),
            children: [k ? (0, F.jsx)(yt, {
                asset: se,
                ariaLabel: D,
                className: `h-full w-full object-cover`,
                showControls: e.showVideoControls ? ? !1,
                onError: ce
            }) : re ? (0, F.jsx)(d, {
                src: re,
                alt: D,
                width: 640,
                height: 360,
                className: `h-full w-full object-cover`
            }) : null, j]
        }) : j, (0, F.jsxs)(`div`, {
            className: `flex flex-col gap-6 p-xl`,
            children: [(0, F.jsx)(X, {
                content: e,
                bulletListClassName: u ? .bulletList,
                toggleState: T
            }), e.ctaCaption && (0, F.jsx)(`p`, {
                className: `m-0 text-body text-secondary`,
                children: e.ctaCaption
            }), (0, F.jsxs)(`div`, {
                className: c(`flex items-center justify-end gap-sm`, u ? .ctaContainer),
                children: [e.dismissText && (0, F.jsx)(o, {
                    size: `lg`,
                    variant: `secondary`,
                    disabled: a,
                    onClick: i,
                    children: e.dismissText
                }), e.ctaActions.map((e, t) => (0, F.jsx)(o, {
                    size: `lg`,
                    variant: t === O ? `primary` : `secondary`,
                    autoFocus: t === ne,
                    disabled: a,
                    onClick: () => n(e, ee),
                    children: e.text
                }, t))]
            })]
        })]
    }) : (0, F.jsxs)(`div`, {
        className: `relative w-[calc(100vw-2rem)]`,
        style: M,
        children: [(0, F.jsxs)(`div`, {
            className: `absolute inset-0 -z-10 flex`,
            children: [(0, F.jsx)(`div`, {
                className: c(`w-full rounded-card bg-surface-0`, A && `md:basis-3/5 md:rounded-e-none`)
            }), A && (0, F.jsx)(`div`, {
                className: c(`hidden rounded-e-[inherit] md:block md:basis-2/5`, le)
            })]
        }), (0, F.jsx)(`div`, {
            className: c(`pointer-events-none sticky top-4 z-10 h-0`, A && `md:hidden`),
            children: (0, F.jsx)(`div`, {
                className: `absolute right-4 top-0`,
                children: (0, F.jsx)(m.CloseButton, {
                    "aria-label": E,
                    className: `pointer-events-auto bg-surface-1 hover:bg-surface-3`
                })
            })
        }), (0, F.jsxs)(`div`, {
            className: c(`grid grid-cols-1`, A && `md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]`),
            children: [(0, F.jsxs)(`div`, {
                className: c(`flex min-w-0 flex-col justify-between gap-lg`, u ? .contentPanel ? ? `p-xl md:pe-xl`),
                children: [(0, F.jsx)(`div`, {
                    className: `flex flex-col gap-md`,
                    children: (0, F.jsx)(X, {
                        content: e,
                        bulletListClassName: u ? .bulletList,
                        toggleState: T
                    })
                }), (0, F.jsxs)(`div`, {
                    className: c(`flex flex-col gap-sm`, e.ctaActions.length === 1 ? `mt-10 md:mt-20` : `mt-6 md:mt-10`, u ? .ctaContainer),
                    children: [e.ctaCaption && (0, F.jsx)(`p`, {
                        className: `mb-2 mt-0 text-body text-secondary`,
                        children: e.ctaCaption
                    }), e.ctaActions.length > 0 && (0, F.jsx)(`div`, {
                        className: `flex flex-col gap-sm`,
                        children: e.ctaActions.map((e, t) => (0, F.jsx)(o, {
                            variant: t === O ? `primary` : `secondary`,
                            autoFocus: t === ne,
                            disabled: a,
                            onClick: () => n(e, ee),
                            children: e.text
                        }, t))
                    }), e.dismissText && (0, F.jsx)(o, {
                        variant: `secondary`,
                        disabled: a,
                        onClick: i,
                        children: e.dismissText
                    })]
                })]
            }), A && (0, F.jsxs)(`div`, {
                className: c(`relative isolate hidden items-center justify-center rounded-e-[inherit] md:flex`, le, u ? .rightPanelContainer ? ? `overflow-hidden`),
                children: [k ? (0, F.jsx)(yt, {
                    asset: se,
                    ariaLabel: D,
                    className: `h-full w-full object-cover`,
                    showControls: e.showVideoControls ? ? !1,
                    onError: ce
                }) : re ? (0, F.jsx)(d, {
                    src: re,
                    alt: D,
                    width: 600,
                    height: 400,
                    className: `h-full w-full object-cover`
                }) : null, j]
            })]
        })]
    })
});
xt.displayName = `SpotlightV2Content`;
var Z = `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] ${l(`popover`)} shadow-panel-lg cds-reset text-body text-primary outline-none`,
    Q = `transition-[opacity,transform] duration-base ease-out data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.98]`,
    St = {
        sm: `max-w-[400px]`,
        md: `max-w-[520px]`,
        lg: `max-w-[720px]`,
        xl: `max-w-[880px]`,
        "2xl": `max-w-[1024px]`,
        "3xl": `max-w-[1152px]`
    },
    Ct = `flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[inherit]`,
    wt = (0, I.memo)(({
        render: e,
        onDismiss: t,
        onAction: n,
        size: r = `xl`,
        maxWidth: i,
        popupClassName: a,
        backdropClassName: o,
        dismissible: s = !0,
        unstyled: l = !1
    }) => {
        let [u, d] = (0, I.useState)(!0), f = re()() ? .setSpotlightActive, p = (0, I.useRef)(f);
        p.current = f;
        let h = f !== void 0;
        (0, I.useEffect)(() => {
            if (!h || !u) return;
            let e = p.current;
            return e ? .(!0), () => e ? .(!1)
        }, [u, h]);
        let g = (0, I.useRef)(null),
            _ = (0, I.useRef)(!1),
            v = (0, I.useRef)(n);
        v.current = n;
        let y = (0, I.useCallback)(() => g.current ? (v.current(g.current.metadata), g.current = null, !0) : !1, []),
            b = (0, I.useCallback)(() => {
                _.current || (_.current = !0, y(), d(!1))
            }, [y]),
            x = (0, I.useCallback)(() => {
                _.current || (_.current = !0, y() || t(), d(!1))
            }, [y, t]);
        (0, I.useEffect)(() => () => {
            _.current || y()
        }, [y]);
        let S = (0, I.useCallback)(e => {
                if (_.current) return;
                let {
                    keepOpen: t,
                    ...r
                } = e ? ? {}, i = Object.keys(r).length > 0 ? r : void 0;
                if (t) {
                    g.current = {
                        metadata: i
                    };
                    return
                }
                g.current = null, n(i), b()
            }, [n, b]),
            C = (0, I.useCallback)(e => {
                e || x()
            }, [x]),
            w = e({
                handleDismiss: x,
                handleAction: S
            }),
            T = i === void 0 ? void 0 : {
                maxWidth: i
            },
            ee = T ? { ...T,
                width: `calc(100vw - 2rem)`
            } : void 0;
        return (0, F.jsx)(m.Root, {
            open: u,
            onOpenChange: C,
            dismissible: s,
            children: (0, F.jsx)(m.Popup, {
                size: r,
                unstyled: l,
                backdropClassName: o,
                className: c(l && [Z, Q, St[r]], `overflow-hidden !border-0`, i !== void 0 && `!max-w-fit`, a),
                children: l ? (0, F.jsx)(`div`, {
                    className: Ct,
                    children: ee ? (0, F.jsx)(`div`, {
                        style: ee,
                        children: w
                    }) : w
                }) : T ? (0, F.jsx)(`div`, {
                    style: T,
                    children: w
                }) : w
            })
        })
    });
wt.displayName = `SpotlightModal`;

function Tt(e, t) {
    let n = e.trim();
    return n ? t === null ? {
        action: `skip`,
        reason: `presets_pending`
    } : t.length === 0 ? {
        action: `skip`,
        reason: `presets_unavailable`
    } : t.some(e => e.id === n) ? {
        action: `apply`,
        id: n
    } : {
        action: `skip`,
        reason: `unknown_preset`
    } : {
        action: `skip`,
        reason: `empty`
    }
}
var $ = `/design/`.replace(/\/$/, ``);

function Et(e, t) {
    let n = Object.values(e ? ? {}).find(e => typeof e == `boolean`);
    if (n !== void 0) return n;
    let r = t ? .[ce];
    return typeof r == `boolean` ? r : void 0
}

function Dt(e, t = window.location.href, n = $) {
    try {
        let r = new URL(e, t);
        return r.protocol !== `http:` && r.protocol !== `https:` ? void 0 : (r.username = ``, r.password = ``, r.origin === new URL(t).origin ? r.pathname === n || r.pathname.startsWith(`${n}/`) ? {
            kind: `internal`,
            path: (r.pathname.slice(n.length) || `/`) + r.search + r.hash
        } : {
            kind: `same-origin-external`,
            href: r.href
        } : {
            kind: `external`,
            href: r.href
        })
    } catch {
        return
    }
}

function Ot({
    content: e,
    enabled: n,
    onAction: r,
    onDismiss: i
}) {
    let a = ne(),
        o = (0, I.useMemo)(() => k.safeParse(e), [e]),
        s = (0, I.useMemo)(() => o.success ? Dt(o.data.ctaHref) : void 0, [o]);
    return (0, I.useEffect)(() => {
        o.success ? s === void 0 && t(`design.experience_framework.unsafe_href`, {
            attrs: {
                template: `design-spotlight-v1`
            }
        }) : t(`design.experience_framework.template_parse_error`, {
            attrs: {
                template: `design-spotlight-v1`
            }
        })
    }, [o, s]), !o.success || !n ? null : (0, F.jsx)(d, {
        density: `compact`,
        className: `contents`,
        children: (0, F.jsx)(wt, {
            onDismiss: i,
            onAction: r,
            size: `xl`,
            unstyled: !0,
            render: ({
                handleDismiss: e,
                handleAction: t
            }) => (0, F.jsx)(he, {
                content: o.data,
                onDismiss: e,
                onCtaClick: () => {
                    t(), s ? .kind === `internal` ? a(s.path) : s ? .kind === `same-origin-external` ? window.location.assign(s.href) : s ? .kind === `external` && window.open(s.href, `_blank`, `noopener,noreferrer`)
                }
            })
        })
    })
}

function kt(e) {
    let t = pe(e),
        n = t[0];
    if (!n) return {};
    let r = t.length > 1 ? {
        actionTypes: t.map(e => e.type)
    } : void 0;
    return n.type === `remote` ? {
        actionType: `remote`,
        actionValue: n.id,
        type: `remote`,
        id: n.id,
        ...r
    } : {
        actionType: n.type,
        actionValue: n.value,
        ...r
    }
}

function At({
    experienceId: e,
    content: n,
    handleDismiss: i,
    handleAction: a
}) {
    let o = ne(),
        {
            showToast: s
        } = O(),
        c = r(),
        l = f(),
        {
            mutateAsync: u
        } = se(),
        d = (0, I.useRef)(!1),
        [m, h] = (0, I.useState)(!1),
        g = (0, I.useRef)(!0);
    (0, I.useEffect)(() => (g.current = !0, () => {
        g.current = !1
    }), []);
    let _ = (0, I.useCallback)(e => {
            for (let n of e ? ? []) switch (n.type) {
                case `show_toast`:
                    typeof n.message == `string` && s(n.message, `success`);
                    break;
                case `dismiss`:
                    break;
                case `refresh_cache`:
                    t(`design.experience_framework.unhandled_client_action`, {
                        attrs: {
                            type: n.type,
                            cache: n.cache
                        }
                    });
                    break;
                default:
                    t(`design.experience_framework.unknown_client_action`, {
                        attrs: {
                            type: n.type
                        }
                    })
            }
        }, [s]),
        v = (0, I.useCallback)(async (n, r) => {
            try {
                if (e === void 0) throw Error(`design-spotlight-v2: remote action without an experienceId`);
                let i = me(n, r);
                if (_((await u({
                        experience_id: e,
                        action_id: n.id,
                        params: i
                    })).actions), n.id === `set_enabled_model_auto_fallback`) {
                    let e = Et(r ? .toggleParams, i);
                    typeof e == `boolean` && !oe({
                        autoFallbackOnRefusal: e
                    }) && t(`design.experience_framework.consent_mirror_persist_failed`, {
                        attrs: {
                            action_id: n.id
                        }
                    })
                }
                return !0
            } catch {
                return t(`design.experience_framework.remote_action_failed`, {
                    attrs: {
                        action_id: n.id
                    }
                }), s(`Something went wrong. Try again.`, `error`), !1
            }
        }, [e, u, _, s]),
        y = (0, I.useCallback)(e => {
            if (e.type === `href`) {
                let n = Dt(e.value);
                return n === void 0 ? t(`design.experience_framework.unsafe_href`, {
                    attrs: {
                        template: `design-spotlight-v2`
                    }
                }) : n.kind === `internal` ? o(n.path) : n.kind === `same-origin-external` ? window.location.assign(n.href) : window.open(n.href, `_blank`, `noopener,noreferrer`), !0
            }
            if (e.type === `model`) {
                if (!e.sticky) return t(`design.experience_framework.model_cta_skipped`, {
                    attrs: {
                        reason: `non_sticky_unsupported`
                    }
                }), !0;
                let n = Tt(e.value, c);
                return n.action === `apply` ? (p(), ae.updateSettings({
                    model: n.id
                }), l(n.id), ie(`composer:set-model`, {
                    id: n.id,
                    via: `spotlight`
                }), !0) : (t(`design.experience_framework.model_cta_skipped`, {
                    attrs: {
                        reason: n.reason
                    }
                }), s(`Something went wrong. Try again.`, `error`), !1)
            }
            return t(`design.experience_framework.unsupported_cta_type`, {
                attrs: {
                    type: e.type
                }
            }), !0
        }, [o, c, l, s]),
        b = (0, I.useCallback)(async (e, t) => {
            if (!d.current) {
                d.current = !0, h(!0);
                try {
                    for (let n of pe(e))
                        if (n.type === `remote`) {
                            if (!await v(n, t)) return
                        } else if (!y(n)) return;
                    g.current && a(kt(e))
                } finally {
                    d.current = !1, g.current && h(!1)
                }
            }
        }, [v, y, a]);
    return (0, F.jsx)(xt, {
        content: n,
        onCtaClick: (e, t) => void b(e, t),
        onDismiss: i,
        ctaDisabled: m
    })
}

function jt({
    experienceId: e,
    content: n,
    enabled: r,
    onAction: i,
    onDismiss: a
}) {
    let o = (0, I.useMemo)(() => fe.safeParse(n), [n]);
    return (0, I.useEffect)(() => {
        o.success || t(`design.experience_framework.template_parse_error`, {
            attrs: {
                template: `design-spotlight-v2`
            }
        })
    }, [o]), !o.success || !r ? null : (0, F.jsx)(d, {
        className: `contents`,
        children: (0, F.jsx)(wt, {
            onDismiss: a,
            onAction: i,
            unstyled: !0,
            popupClassName: `!max-w-fit`,
            render: ({
                handleDismiss: t,
                handleAction: n
            }) => (0, F.jsx)(At, {
                experienceId: e,
                content: o.data,
                handleDismiss: t,
                handleAction: n
            })
        })
    })
}
var {
    Placement: Mt
} = g({
    placementKey: `design-spotlight`,
    templateComponents: {
        "design-spotlight-v1": () => Promise.resolve({
            default: Ot
        }),
        "design-spotlight-v2": () => Promise.resolve({
            default: jt
        })
    }
});

function Nt() {
    return (0, F.jsx)(Mt, {})
}
export {
    Nt as DesignSpotlightPlacement, Dt as classifyHref, Et as extractAutoFallbackConsent, Tt as t
};