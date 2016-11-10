var getClickCoordinates= function(e, parentEl) {
    var _offset = offset(parentEl || e.currentTarget);
    var _e = e.pageX ? e : e.touches[0];
    return {
        x: _e.pageX - _offset.left,
        y: _e.pageY - _offset.top
    };
};