/**
 * Snap SVG Based Color Picker
 * Based on RaphaelJS color picker by Dmitry Baranovskiy available here:
 * http://raphaeljs.com/picker.html
 *
 * Adapted to Snap SVG by Chris Gordon
 * 
 * Free to use however you like.
 */
Snap.plugin( function( Snap, Element, Paper, global ) {
    Paper.prototype.colorpicker = function (size, initcolor, colourCallback) {
        return new ColorPicker(size, initcolor, this.paper, colourCallback);
    };

    Paper.prototype.colorWheel = function (x, y, r) {
        var pi = Math.PI;
        var segments = pi * r * 2 / Math.min(r / 8, 4);
        var a = pi / 2 - pi * 2 / segments * 1.5,

            path = "M" + x + "," + (y - r) + " A" + r + "," + r + " 0 0," + 1 + " " + (r * Math.cos(a) + x) + "," + (y - r * Math.sin(a)) + " L" + x + "," + y + " z";
        for (var i = 0; i < segments; i++) {
            this.path(path).attr({
                stroke: "none",
                fill: "hsb(" + (segments - i) * (255 / segments) / 255 + ", 1, 1)",
                transform: "r" + [90 + (360 / segments) * i, x, y]
            });
        }
        return this.paper.circle(x, y, r).attr({
            fill: this.paper.gradient("r()#fff-rgba(255,255,255,0)"),
            "fill-opacity": 1,
            "stroke-width": Math.round(r * .03),
            stroke: "#E6E6E6"
        });
    };

    ColorPicker = function (size, initcolor, paper, colourCallback) {
        size = size || 200;
        var w3 = 3 * size / 200,
            w1 = size / 200,
            fi = 1.6180339887,
            size20 = size / 20,
            size2 = size / 2,
            padding = 2 * size / 200,
            height = size + size20 * 2 + padding * 3,
            t = this,
            s = size - (size20 * 4),
            snap = paper,
            xy = s / 6 + size20 * 2 + padding,
            wh = s * 2 / 3 - padding * 2;
        w1 < 1 && (w1 = 1);
        w3 < 1 && (w3 = 1);

        // Colour wheek
        snap.colorWheel(size2, size2, size2 - padding);

        // Circular cursor
        t.cursor =  snap.group();
        t.cursor.add(snap.circle(size2, size2, size20 / 2).attr({
            stroke: "#000",
            opacity: .5,
            "stroke-width": w3,
            fill : "none"
        }));
        t.cursor.add(t.cursor[0].clone().attr({
            stroke: "#fff",
            opacity: 1,
            "stroke-width": w1
        }));
        t.disc = snap.circle(size2, size2, size2 - padding).attr({
            fill: "#000",
            "fill-opacity": 0,
            stroke: "none",
            cursor: "crosshair"
        });
        
        var style = t.disc.node.style;
        style.unselectable = "on";
        style.MozUserSelect =  "none";
        style.WebkitUserSelect= "none";

        // Brightness slider
        var h = size20 * 2 + 2;
        t.brect = snap.rect(padding + h / fi / 2, size + padding * 2, size - padding * 2 - h / fi, h - padding * 2).attr({
            stroke: "#E6E6E6",
            "stroke-width": Math.round((size2 - padding) * .03),
            fill: "none"//snap.gradient("l(0,0,100,100)#fff-#000")
        });
        t.cursorb = snap.group();
        t.cursorb.add(snap.rect(padding, size + padding, ~~(h / fi), h, w3).attr({
            stroke: "#000",
            opacity: .5,
            "stroke-width": w3,
            fill: "black"
        }));

        t.cursorb.add(t.cursorb[0].clone().attr({
            stroke: "#fff",
            opacity: 1,
            "stroke-width": w1,
            fill: "none"
        }));

        t.btop = t.brect.clone().attr({
            stroke: "#000",
            fill: "none",
            opacity: 0
        });
        style = t.btop.node.style;
        style.unselectable = "on";
        style.MozUserSelect =  "none";
        style.WebkitUserSelect= "none";
    
        t.bwidth = ~~(h / fi) / 2;
        t.minx = padding + t.bwidth;
        t.maxx = size - h / fi - padding + t.bwidth;

        t.H = t.S = t.B = 1;
        t.padding = padding;
        t.snap = snap;
        t.size2 = size2;
        t.size20 = size20;
        
        // Colour disc drag
        t.disc.drag(function (dx, dy, x, y) {
            // Account for SVG offset in Dom
            x = x - t.snap.paper.node.offsetLeft;
            y = y - t.snap.paper.node.offsetTop;
            t.docOnMove(dx, dy, x, y);
        }, function (x, y) {
            x = x - t.snap.paper.node.offsetLeft;
            y = y - t.snap.paper.node.offsetTop;

            t.hsOnTheMove = true;
            t.setHS(x, y);
        }, function () {
            t.hsOnTheMove = false;
            if(typeof(colourCallback) != 'undefined') {
                colourCallback(t.getSelectedColor());
            }
        });
        //Brightness slider drag.
        t.btop.attr({ fill : "#fff", opacity : 0.001 });
        t.btop.drag(function (dx, dy, x, y) {
            x = x - t.snap.paper.node.offsetLeft;
            t.docOnMove(dx, dy, x, y);
        }, function (x, y) {
            x = x - t.snap.paper.node.offsetLeft;
            t.bOnTheMove = true;
            t.setB(x);
        }, function () {
            t.bOnTheMove = false;
            if(typeof(colourCallback) != 'undefined') {
                colourCallback(t.getSelectedColor());
            }
        });

        t.setColor(initcolor || "#fff");
        this.onchanged && this.onchanged(this.color());
    };

    ColorPicker.prototype.angle = function angle(x, y) {
        return (x < 0) * 180 + Math.atan(-y / -x) * 180 / Math.PI;
    };

    ColorPicker.prototype.setB = function (x) {
        x < this.minx && (x = this.minx);
        x > this.maxx && (x = this.maxx);

        this.cursorb.transform("T" + (x - this.bwidth) + "," + 0 );
        this.B = 1- ((x - this.minx) / (this.maxx - this.minx));
        this.onchange && this.onchange(this.setColor());
    };

    ColorPicker.prototype.setHS = function (x, y) {
        var X = x - this.size2,
            Y = y - this.size2,
            R = this.size2 - this.size20 / 2 - this.padding,
            d = this.angle(X, Y),
            rd = d * Math.PI / 180;
        isNaN(d) && (d = 0);
        if (X * X + Y * Y > R * R) {
            x = R * Math.cos(rd) + this.size2;
            y = R * Math.sin(rd) + this.size2;
        }

        this.cursor[0].attr({cx: x, cy: y});
        this.cursor[1].attr({cx: x, cy: y});

        this.H = (1 - d / 360) % 1;
        this.S = Math.min((X * X + Y * Y) / R / R, 1);
        //snap.gradient("l(0,0,100,100)#fff-#000")
        this.selectedColor = "hsb(" + [this.H, this.S] + ",1)";
        this.brect.attr({fill: this.brect.paper.gradient("l(0,0,1,0)hsb(" + [this.H, this.S] + ",1)-#000")});
        this.onchange && this.onchange(this.color());
    };
 
    ColorPicker.prototype.docOnMove = function (dx, dy, x, y) {
        if (this.hsOnTheMove) {
            this.setHS(x, y);
        }
        if (this.bOnTheMove) {
            this.setB(x);
        }
    };

    ColorPicker.prototype.remove = function () {
        this.snap.remove();
        this.color = function () {
            return false;
        };
    };
    
    /**
     * Set color selected 
     * @var color - can be any formats accepted by Snap.getRGB see:
     * http://snapsvg.io/docs/#Snap.getRGB
     */
    ColorPicker.prototype.setColor = function (color) {
        if (color) {
            color = Snap.getRGB(color);

            var hex = color.hex;
            color = Snap.rgb2hsb(color.r, color.g, color.b);
            d = color.h * 360;
            this.H = color.h;
            this.S = color.s;
            this.B = color.b;

            this.cursorb.attr({x: this.B * (this.maxx - this.minx) + this.minx - this.bwidth});
            this.brect.attr({fill: this.brect.paper.gradient("l(0,0,1,0)hsb(" + [this.H, this.S] + ",1)-#000")});

            var d = (1 - this.H) * 360,
                rd = d * Math.PI / 180,
                R = (this.size2 - this.size20 / 2 - this.padding) * this.S,
                x = Math.cos(rd) * R + this.size2,
                y = Math.sin(rd) * R + this.size2;
            this.cursor[0].attr({cx: x, cy: y});
            this.cursor[1].attr({cx: x, cy: y});
            return this;
        } else {
            return Snap.hsb2rgb(this.H, this.S, this.B).hex;
        }
    };

    /**
     * Get currently selected color.
     */
    ColorPicker.prototype.getSelectedColor = function () {
        return Snap.hsb2rgb(this.H, this.S, this.B);
    };
});
