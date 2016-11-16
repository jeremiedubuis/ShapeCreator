var getClickCoordinates= function(e, parentEl) {
    var _offset = offset(parentEl || e.currentTarget);
    var _e = typeof e.pageX !== 'undefined' ? e : e.touches[0];
    return {
        x: _e.pageX - _offset.left,
        y: _e.pageY - _offset.top
    };
};