/**
 * ================================================================================
 *                                  CanvasShape
 * ================================================================================
 */

var CanvasShape = function(bounds1, bounds2, type) {
    this.init(bounds1, bounds2, type);
};

CanvasShape.prototype = {
    init: function(bounds1, bounds2, type) {

        this.type = type;
        this.points = [];
        if (bounds1 && bounds2) this.boundaries = [bounds1,bounds2];
        this.onUpdate = function() {};
        this.onMove = function() {};
        this.onScale = function() {};
    },

    closeShape: function() {

        switch (this.type) {
            case 'rectangle':
                if (this.points.length !==4) {
                    this.points.push({x: this.points[0].x,y:this.points[1].y});
                    this.points.splice(1,0,{x: this.points[1].x, y:this.points[0].y});
                }
                break;
        }

        this.pointsToVectorsFromCenter();
        this.closed = true;
    },
    renderPoints: true,
    defineOptions: function(options) {
        if (options) {
            if (options.rounded) this.rounded = options.rounded;
            if (options.renderingContext) this.renderingContext = options.renderingContext;
            if (typeof options.renderPoints !=='undefined') this.renderPoints = options.renderPoints;

            if (options.onMove) this.onMove = options.onMove;
            if (options.onScale) this.onScale = options.onScale;
            if (options.onUpdate) this.onScale = options.onUpdate;

        }
    },

    move: function(amountHorizontal,amountVertical, ignoreBounds) {

        if (this.boundaries) {
            var _outOfBoundsX;
            var _outOfBoundsY;
            var x;
            var y;
            for (var i = 0, j = this.points.length; i<j; ++i) {
                x = this.points[i].x + amountHorizontal;
                y = this.points[i].y + amountVertical;
                if ( x < this.boundaries[0].x || x> this.boundaries[1].x  ) _outOfBoundsX = true
                if ( y < this.boundaries[0].y || y > this.boundaries[1].y ) _outOfBoundsY = true;
            }
        }

        if (!_outOfBoundsX || ignoreBounds) this.center.x += amountHorizontal;
        if (!_outOfBoundsY || ignoreBounds) this.center.y += amountVertical;
        this.onMove(this);
        this.onUpdate(this);
    },

    scaleRectByAnchor: function(pointIndex, coordinates) {
        this.points[pointIndex].x = coordinates.x;
        this.points[pointIndex].y = coordinates.y;
        switch (pointIndex) {
            case 0:
                this.points[1].y = coordinates.y;
                this.points[3].x = coordinates.x;
                break;
            case 1:
                this.points[0].y = coordinates.y;
                this.points[2].x = coordinates.x;
                break;
            case 2:
                this.points[3].y = coordinates.y;
                this.points[1].x = coordinates.x;
                break;
            case 3:
                this.points[2].y = coordinates.y;
                this.points[0].x = coordinates.x;
                break;
        }
        this.pointsToVectorsFromCenter();
        this.onScale(this);
        this.onUpdate(this);
    },

    scale: function(amountHorizontal, amountVertical) {
        if (typeof amountVertical === 'undefined') amountVertical = amountHorizontal;
        this.scaleX += amountHorizontal / this.ratio;
        this.scaleY += amountVertical / this.ratio;
        if (this.scaleX<.1) this.scaleX = .1;
        if (this.scaleY<.1) this.scaleY = .1;
        this.onScale(this);
        this.onUpdate(this);
    },

    scalePercents: function(amountHorizontal, amountVertical) {
        if (typeof amountVertical === 'undefined') amountVertical = amountHorizontal;
        amountHorizontal = amountHorizontal *.01;
        amountVertical = amountVertical *.01;

        var _center = this.getCenter();
        var _distX;
        var _distY;

        this.points = this.points.map(function(p) {
            _distX = p.x-_center.x;
            _distX += _distX * amountHorizontal;
            p.x = _center.x + _distX;
            _distY = p.y-_center.y;
            _distY += _distY * amountVertical;
            p.y = _center.y + _distY;
            return p;
        });

        this.pointsToVectorsFromCenter();
        this.onScale(this);
        this.onUpdate(this);

    },

    polygonScale: function(amountHorizontal, amountVertical) {
        var _scale = (amountHorizontal+ amountVertical) / 2;
        this.scale( _scale, _scale);
        this.onScale(this);
        this.onUpdate(this);
    },

    getCenter: function() {

        var _centerX = 0;
        var _centerY= 0;
        this.points.forEach(function(point) {
            _centerX += point.x;
            _centerY += point.y;
        });
        this.center = {
            x: _centerX/ this.points.length,
            y: _centerY/ this.points.length
        };

        return this.center;

    },

    distanceFromCenter: function(point) {
        return vectorLength(point, this.center || this.getCenter())
    },

    distanceXFromCenter: function(point, absolute) {
        if (absolute) return Math.abs(point.x - (this.center || this.getCenter()).x);
        return point.x - (this.center || this.getCenter()).x;
    },

    distanceYFromCenter: function(point, absolute) {
        if (absolute) return Math.abs(point.y - (this.center || this.getCenter()).y);
        return point.y - (this.center || this.getCenter()).y;
    },

    containsPoint: function(point) {

        // There must be at least 3 vertices in polygon
        if (this.points.length < 3)  return false;


        // Count intersections of the above line with sides of polygon
        var _count = 0;

        var point1;
        var point2;
        for (var i=0, length = this.points.length; i<length; ++i) {

            point1 = this.points[i];
            point2 = i === length-1 ? this.points[0] : this.points[i+1]; //last point is first point of polygon

            if (segmentsIntersect(
                    point, { x: document.documentElement.offsetWidth, y:point.y },
                    point1, point2
                )) {

                if (triangleOrientation(point1, point, point2) === 0){
                    return pointOnSegment(point, point1, point2);
                }
                _count+= 1;
            }

        }

        // Return true if count is odd, false otherwise
        return _count&1;  // Same as (count%2 == 1)
    },

    pointsToVectorsFromCenter: function() {
        var _this = this;
        var _furthestFromCenter;
        var _dist;
        var points = this.points;
        this.vectorsFromCenter = [];
        points.forEach(function(_point) {
            _dist = _this.distanceFromCenter(_point)
            if (typeof _furthestFromCenter === 'undefined' || _dist > _furthestFromCenter) _furthestFromCenter = _dist;
            _this.vectorsFromCenter.push({
                x:_this.distanceXFromCenter(_point),
                y:_this.distanceYFromCenter(_point)
            })
        });

        _furthestFromCenter = Math.max(_furthestFromCenter,1);

        this.vectorsFromCenter = _this.vectorsFromCenter.map(function(_point) {
            return {
                x: _point.x / _furthestFromCenter,
                y: _point.y / _furthestFromCenter
            };
        });
        this.ratio = _furthestFromCenter;

        return this.vectorsFromCenter;
    },

    scaleX: 1,
    scaleY: 1,

    vectorsFromCenterToPoints: function(vectors) {
        this.points = [];
        var _this = this;
        vectors.forEach(function(vector) {
            _this.points.push({
                x: _this.center.x + vector.x * (_this.scaleX * _this.ratio),
                y: _this.center.y + vector.y * (_this.scaleY * _this.ratio)
            });
        });

        return this.points;
    },

    getPoints: function() {
        return this.vectorsFromCenterToPoints( this.vectorsFromCenter || this.pointsToVectorsFromCenter() );
    },

    removePointsRecursively: function(points, multiple, currentIndex) {
        currentIndex+=multiple;
        if (points[currentIndex]) {
            points.splice(currentIndex, 1);
            return this.removePointsRecursively( points, multiple, currentIndex+multiple -1 ); // we just deleted an entry so index goes back by 1
        } else {
            return points;
        }
    },

    export: function() {
        return {
            type: this.type,
            points: this.points,
            vectors: this.vectorsFromCenter,
            ratio: this.ratio,
            center: this.center
        };
    }
};