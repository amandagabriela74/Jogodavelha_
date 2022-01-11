
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // o estado do jogo guarda a informação sobre a tela questamos no momento
    let estado = writable('menu');

    function trocarEstadoDoJogo(novoEstado) {
    	estado.set(novoEstado);
    }

    /* src\Menu.svelte generated by Svelte v3.44.3 */
    const file$3 = "src\\Menu.svelte";

    function create_fragment$4(ctx) {
    	let link;
    	let t0;
    	let h1;
    	let t2;
    	let img;
    	let img_src_value;
    	let t3;
    	let br0;
    	let br1;
    	let t4;
    	let div0;
    	let t6;
    	let div1;
    	let t8;
    	let div2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Jogo da Velha";
    			t2 = space();
    			img = element("img");
    			t3 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t4 = space();
    			div0 = element("div");
    			div0.textContent = "Jogar";
    			t6 = space();
    			div1 = element("div");
    			div1.textContent = "Sobre";
    			t8 = space();
    			div2 = element("div");
    			div2.textContent = "Ajuda";
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/menu.css");
    			add_location(link, file$3, 1, 1, 16);
    			add_location(h1, file$3, 9, 0, 196);
    			attr_dev(img, "class", "imagem");
    			if (!src_url_equal(img.src, img_src_value = "jogodavelha.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			add_location(img, file$3, 13, 0, 227);
    			add_location(br0, file$3, 15, 0, 286);
    			add_location(br1, file$3, 15, 4, 290);
    			attr_dev(div0, "class", "menu");
    			add_location(div0, file$3, 17, 0, 298);
    			attr_dev(div1, "class", "menu");
    			add_location(div1, file$3, 21, 0, 381);
    			attr_dev(div2, "class", "menu");
    			add_location(div2, file$3, 25, 0, 464);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, img, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[1], false, false, false),
    					listen_dev(div2, "click", /*click_handler_2*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Menu', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => trocarEstadoDoJogo('jogar');
    	const click_handler_1 = () => trocarEstadoDoJogo('sobre');
    	const click_handler_2 = () => trocarEstadoDoJogo('ajuda');
    	$$self.$capture_state = () => ({ estado, trocarEstadoDoJogo });
    	return [click_handler, click_handler_1, click_handler_2];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\VoltarMenu.svelte generated by Svelte v3.44.3 */
    const file$2 = "src\\VoltarMenu.svelte";

    function create_fragment$3(ctx) {
    	let link;
    	let t0;
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			div = element("div");
    			div.textContent = "Voltar ao menu";
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/menu.css");
    			add_location(link, file$2, 1, 1, 16);
    			attr_dev(div, "class", "menu");
    			add_location(div, file$2, 8, 0, 157);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VoltarMenu', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<VoltarMenu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => trocarEstadoDoJogo('menu');
    	$$self.$capture_state = () => ({ trocarEstadoDoJogo });
    	return [click_handler];
    }

    class VoltarMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VoltarMenu",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Sobre.svelte generated by Svelte v3.44.3 */
    const file$1 = "src\\Sobre.svelte";

    function create_fragment$2(ctx) {
    	let link;
    	let t0;
    	let body;
    	let main;
    	let header;
    	let img;
    	let img_src_value;
    	let t1;
    	let div0;
    	let p0;
    	let strong0;
    	let t3;
    	let p1;
    	let strong1;
    	let t5;
    	let t6;
    	let p2;
    	let strong2;
    	let t8;
    	let t9;
    	let p3;
    	let strong3;
    	let t11;
    	let t12;
    	let div1;
    	let section;
    	let br0;
    	let br1;
    	let t13;
    	let h1;
    	let t15;
    	let br2;
    	let br3;
    	let t16;
    	let h30;
    	let t18;
    	let br4;
    	let t19;
    	let p4;
    	let t21;
    	let br5;
    	let t22;
    	let h31;
    	let t24;
    	let br6;
    	let t25;
    	let p5;
    	let t27;
    	let br7;
    	let t28;
    	let br8;
    	let t29;
    	let br9;
    	let t30;
    	let br10;
    	let t31;
    	let voltarmenu;
    	let current;
    	voltarmenu = new VoltarMenu({ $$inline: true });

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			body = element("body");
    			main = element("main");
    			header = element("header");
    			img = element("img");
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "Instituto Federal de Educação, Ciência e Tecnologia - IFPE";
    			t3 = space();
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Cursos:";
    			t5 = text(" Informática para Internet (IPI) / Sistemas para Internet (TSI)");
    			t6 = space();
    			p2 = element("p");
    			strong2 = element("strong");
    			strong2.textContent = "Componentes:";
    			t8 = text(" Lógica de Programação e Estrutura de Dados | Programação Imperativa");
    			t9 = space();
    			p3 = element("p");
    			strong3 = element("strong");
    			strong3.textContent = "Alunos:";
    			t11 = text("  Amanda Gabriela, Andrey Santana, Bruno Wilian, Daniele Saara e Flávio de Lima.");
    			t12 = space();
    			div1 = element("div");
    			section = element("section");
    			br0 = element("br");
    			br1 = element("br");
    			t13 = space();
    			h1 = element("h1");
    			h1.textContent = "Sobre";
    			t15 = space();
    			br2 = element("br");
    			br3 = element("br");
    			t16 = space();
    			h30 = element("h3");
    			h30.textContent = "1. Sobre o Projeto:";
    			t18 = space();
    			br4 = element("br");
    			t19 = space();
    			p4 = element("p");
    			p4.textContent = "Jogo desenvolvido por estudantes do Instituto Federal de Pernambuco - Campus Igarassu, utilizando recursos do compilador front-end Svelte para construir componentes através das linguagens JavaScript (Programação), HTML (Marcação de HiperTexto) e CSS (Estilo).";
    			t21 = space();
    			br5 = element("br");
    			t22 = space();
    			h31 = element("h3");
    			h31.textContent = "2. Sobre o Jogo:";
    			t24 = space();
    			br6 = element("br");
    			t25 = space();
    			p5 = element("p");
    			p5.textContent = "euwinnnnnnnnnndwoooooooooeunddddddddddqlmxxxx";
    			t27 = space();
    			br7 = element("br");
    			t28 = space();
    			br8 = element("br");
    			t29 = space();
    			br9 = element("br");
    			t30 = space();
    			br10 = element("br");
    			t31 = space();
    			create_component(voltarmenu.$$.fragment);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/sobre.css");
    			add_location(link, file$1, 1, 1, 16);
    			attr_dev(img, "class", "cabecalho-imagem");
    			if (!src_url_equal(img.src, img_src_value = "ifpe.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Logo do IFPE");
    			add_location(img, file$1, 11, 8, 214);
    			add_location(strong0, file$1, 13, 40, 358);
    			attr_dev(p0, "class", "cabecalho-ifpe-a");
    			add_location(p0, file$1, 13, 12, 330);
    			add_location(strong1, file$1, 14, 40, 481);
    			attr_dev(p1, "class", "cabecalho-ifpe-a");
    			add_location(p1, file$1, 14, 12, 453);
    			add_location(strong2, file$1, 15, 40, 614);
    			attr_dev(p2, "class", "cabecalho-ifpe-a");
    			add_location(p2, file$1, 15, 12, 586);
    			add_location(strong3, file$1, 16, 40, 757);
    			attr_dev(p3, "class", "cabecalho-ifpe-a");
    			add_location(p3, file$1, 16, 12, 729);
    			attr_dev(div0, "class", "cabecalho-ifpe");
    			add_location(div0, file$1, 12, 8, 288);
    			attr_dev(header, "class", "cabecalho");
    			add_location(header, file$1, 10, 4, 178);
    			add_location(br0, file$1, 22, 12, 986);
    			add_location(br1, file$1, 22, 16, 990);
    			attr_dev(h1, "class", "conteudo-principal-titulo");
    			add_location(h1, file$1, 23, 12, 1008);
    			add_location(br2, file$1, 24, 12, 1070);
    			add_location(br3, file$1, 24, 16, 1074);
    			attr_dev(h30, "class", "conteudo-principal-subtitulo");
    			add_location(h30, file$1, 25, 12, 1092);
    			add_location(br4, file$1, 26, 12, 1171);
    			attr_dev(p4, "class", "conteudo-principal-paragrafo");
    			add_location(p4, file$1, 27, 12, 1189);
    			add_location(br5, file$1, 28, 12, 1506);
    			attr_dev(h31, "class", "conteudo-principal-subtitulo");
    			add_location(h31, file$1, 29, 12, 1524);
    			add_location(br6, file$1, 30, 12, 1600);
    			attr_dev(p5, "class", "conteudo-principal-paragrafo");
    			add_location(p5, file$1, 31, 12, 1618);
    			attr_dev(section, "class", "conteudo-principal");
    			add_location(section, file$1, 21, 8, 936);
    			attr_dev(div1, "class", "conteudo");
    			add_location(div1, file$1, 20, 4, 904);
    			add_location(br7, file$1, 35, 4, 1753);
    			add_location(br8, file$1, 36, 4, 1763);
    			add_location(main, file$1, 9, 4, 166);
    			add_location(br9, file$1, 38, 4, 1786);
    			add_location(br10, file$1, 39, 4, 1796);
    			add_location(body, file$1, 8, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, body, anchor);
    			append_dev(body, main);
    			append_dev(main, header);
    			append_dev(header, img);
    			append_dev(header, t1);
    			append_dev(header, div0);
    			append_dev(div0, p0);
    			append_dev(p0, strong0);
    			append_dev(div0, t3);
    			append_dev(div0, p1);
    			append_dev(p1, strong1);
    			append_dev(p1, t5);
    			append_dev(div0, t6);
    			append_dev(div0, p2);
    			append_dev(p2, strong2);
    			append_dev(p2, t8);
    			append_dev(div0, t9);
    			append_dev(div0, p3);
    			append_dev(p3, strong3);
    			append_dev(p3, t11);
    			append_dev(main, t12);
    			append_dev(main, div1);
    			append_dev(div1, section);
    			append_dev(section, br0);
    			append_dev(section, br1);
    			append_dev(section, t13);
    			append_dev(section, h1);
    			append_dev(section, t15);
    			append_dev(section, br2);
    			append_dev(section, br3);
    			append_dev(section, t16);
    			append_dev(section, h30);
    			append_dev(section, t18);
    			append_dev(section, br4);
    			append_dev(section, t19);
    			append_dev(section, p4);
    			append_dev(section, t21);
    			append_dev(section, br5);
    			append_dev(section, t22);
    			append_dev(section, h31);
    			append_dev(section, t24);
    			append_dev(section, br6);
    			append_dev(section, t25);
    			append_dev(section, p5);
    			append_dev(main, t27);
    			append_dev(main, br7);
    			append_dev(main, t28);
    			append_dev(main, br8);
    			append_dev(body, t29);
    			append_dev(body, br9);
    			append_dev(body, t30);
    			append_dev(body, br10);
    			insert_dev(target, t31, anchor);
    			mount_component(voltarmenu, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(voltarmenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(voltarmenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(body);
    			if (detaching) detach_dev(t31);
    			destroy_component(voltarmenu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sobre', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sobre> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ VoltarMenu });
    	return [];
    }

    class Sobre extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sobre",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Ajuda.svelte generated by Svelte v3.44.3 */
    const file = "src\\Ajuda.svelte";

    function create_fragment$1(ctx) {
    	let link;
    	let t0;
    	let body;
    	let main;
    	let section;
    	let h1;
    	let t2;
    	let h2;
    	let t4;
    	let h30;
    	let t6;
    	let p0;
    	let t8;
    	let h31;
    	let t10;
    	let p1;
    	let t12;
    	let h32;
    	let t14;
    	let p2;
    	let t16;
    	let br;
    	let t17;
    	let voltarmenu;
    	let current;
    	voltarmenu = new VoltarMenu({ $$inline: true });

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			body = element("body");
    			main = element("main");
    			section = element("section");
    			h1 = element("h1");
    			h1.textContent = "Suporte";
    			t2 = space();
    			h2 = element("h2");
    			h2.textContent = "Encontre aqui suas dúvidas sobre o Jogo da Velha:";
    			t4 = space();
    			h30 = element("h3");
    			h30.textContent = "1. Como jogar?";
    			t6 = space();
    			p0 = element("p");
    			p0.textContent = "O jogo da velha é uma brincadeira antiga, clássica e simples — que só precisa de duas pessoas para o jogo começar. Ele é um jogo de \"soma zero\", ou seja, duas pessoas igualmente habilidosas nunca conseguem derrotar uma à outra. No entanto, se você seguir as dicas e estratégias, vai ter muito mais chances de ser vitorioso nas partidas.";
    			t8 = space();
    			h31 = element("h3");
    			h31.textContent = "2. Como funciona?";
    			t10 = space();
    			p1 = element("p");
    			p1.textContent = "mais comum é o primeiro jogador usar \"X\", mas você pode deixar a pessoa escolher entre \"X\" e \"O\". Cada um tem que tentar formar uma fila com o seu respectivo símbolo nas casas do tabuleiro. Se você jogar primeiro, desenhe o seu símbolo na casa do meio para otimizar as suas chances de vencer — já que vai ter mais chances de criar uma fila de \"X\" ou \"O\"";
    			t12 = space();
    			h32 = element("h3");
    			h32.textContent = "3. Qual a melhor estratégia para jogar?";
    			t14 = space();
    			p2 = element("p");
    			p2.textContent = "Marque um dos cantos e, dependendo do que seu oponente fizer, marque outro canto, e você estará com a vitória nas mãos. Por exemplo, se você faz o X no canto inferior esquerdo, e ele coloca o O no canto inferior direito, você deve responder com um X no canto superior esquerdo.";
    			t16 = space();
    			br = element("br");
    			t17 = space();
    			create_component(voltarmenu.$$.fragment);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/ajuda.css");
    			add_location(link, file, 1, 1, 16);
    			add_location(h1, file, 11, 2, 204);
    			add_location(h2, file, 13, 3, 227);
    			add_location(h30, file, 15, 3, 292);
    			add_location(p0, file, 16, 3, 320);
    			add_location(h31, file, 18, 3, 670);
    			add_location(p1, file, 19, 3, 701);
    			add_location(h32, file, 21, 3, 1068);
    			add_location(p2, file, 22, 3, 1122);
    			attr_dev(section, "class", "conteudo");
    			add_location(section, file, 10, 2, 174);
    			add_location(main, file, 9, 1, 163);
    			add_location(body, file, 8, 0, 154);
    			add_location(br, file, 26, 0, 1441);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, body, anchor);
    			append_dev(body, main);
    			append_dev(main, section);
    			append_dev(section, h1);
    			append_dev(section, t2);
    			append_dev(section, h2);
    			append_dev(section, t4);
    			append_dev(section, h30);
    			append_dev(section, t6);
    			append_dev(section, p0);
    			append_dev(section, t8);
    			append_dev(section, h31);
    			append_dev(section, t10);
    			append_dev(section, p1);
    			append_dev(section, t12);
    			append_dev(section, h32);
    			append_dev(section, t14);
    			append_dev(section, p2);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t17, anchor);
    			mount_component(voltarmenu, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(voltarmenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(voltarmenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(body);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t17);
    			destroy_component(voltarmenu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Ajuda', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Ajuda> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ VoltarMenu });
    	return [];
    }

    class Ajuda extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ajuda",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.3 */

    // (17:30) 
    function create_if_block_2(ctx) {
    	let ajuda;
    	let current;
    	ajuda = new Ajuda({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(ajuda.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(ajuda, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ajuda.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ajuda.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ajuda, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(17:30) ",
    		ctx
    	});

    	return block;
    }

    // (15:30) 
    function create_if_block_1(ctx) {
    	let sobre;
    	let current;
    	sobre = new Sobre({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(sobre.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sobre, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sobre.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sobre.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sobre, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(15:30) ",
    		ctx
    	});

    	return block;
    }

    // (12:0) {#if $estado === 'menu'}
    function create_if_block(ctx) {
    	let menu;
    	let current;
    	menu = new Menu({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:0) {#if $estado === 'menu'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$estado*/ ctx[0] === 'menu') return 0;
    		if (/*$estado*/ ctx[0] === 'sobre') return 1;
    		if (/*$estado*/ ctx[0] === 'ajuda') return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $estado;
    	validate_store(estado, 'estado');
    	component_subscribe($$self, estado, $$value => $$invalidate(0, $estado = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Menu, Sobre, Ajuda, estado, $estado });
    	return [$estado];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
