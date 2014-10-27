///////////////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.API
// by Philippe Leefsma, October 2014
//
///////////////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.API = function (viewer, options) {

    Autodesk.Viewing.Extension.call(this, viewer, options);

    _self = this;

    _self.load = function () {

        console.log('Autodesk.ADN.Viewing.Extension.API loaded');

        ///////////////////////////////////////////////////////////////////////////
        // Generate GUID
        //
        ///////////////////////////////////////////////////////////////////////////
        function newGuid() {

            var d = new Date().getTime();

            var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
                /[xy]/g,
                function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
                });

            return guid;
        };

        var Stopwatch = function() {

            var _startTime = new Date().getTime();

            this.start = function (){

                _startTime = new Date().getTime();
            };

            this.getElapsedMs = function(){

                var elapsedMs = new Date().getTime() - _startTime;

                _startTime = new Date().getTime();

                return elapsedMs;
            }
        }

        ///////////////////////////////////////////////////////////////////////////
        // Get current view
        //
        ///////////////////////////////////////////////////////////////////////////
        Autodesk.Viewing.Viewer.prototype.getCurrentView =

            function (viewname) {

                var view = {

                    id: newGuid(),
                    name: viewname,

                    position: this.navigation.getPosition(),
                    target: this.navigation.getTarget(),
                    fov: this.getFOV(),
                    up: this.navigation.getCameraUpVector()
                };

                return view;
            };

        ///////////////////////////////////////////////////////////////////////////
        // Set view
        //
        ///////////////////////////////////////////////////////////////////////////
        Autodesk.Viewing.Viewer.prototype.setView =

            function (view) {

                this.navigation.setRequestTransitionWithUp(
                    true,

                    new THREE.Vector3(
                        view.position.x,
                        view.position.y,
                        view.position.z),

                    new THREE.Vector3(
                        view.target.x,
                        view.target.y,
                        view.target.z),

                    view.fov,

                    new THREE.Vector3(
                        view.up.x,
                        view.up.y,
                        view.up.z));

                this.resize();
            };

        ///////////////////////////////////////////////////////////////////////////
        // Get Property Value
        //
        ///////////////////////////////////////////////////////////////////////////
        Autodesk.Viewing.Viewer.prototype.getPropertyValue =

            function (dbId, displayName, callback) {

                function _cb(result) {

                    if (result.properties) {

                        for (var i = 0; i < result.properties.length; i++) {

                            var prop = result.properties[i];

                            if (prop.displayName === displayName) {

                                callback(prop.displayValue);
                                return;
                            }
                        }

                        callback('undefined');
                    }
                }

                this.getProperties(dbId, _cb);
            };

        ///////////////////////////////////////////////////////////////////////////
        // Get all leaf components
        //
        ///////////////////////////////////////////////////////////////////////////
        Autodesk.Viewing.Viewer.prototype.getAllLeafComponents =

            function (callback) {

                function getLeafComponentsRec(parent) {

                    var components = [];

                    if (typeof parent.children !== "undefined") {

                        var children = parent.children;

                        for (var i = 0; i < children.length; i++) {

                            var child = children[i];

                            if (typeof child.children !== "undefined") {

                                var subComps = getLeafComponentsRec(child);

                                components.push.apply(components, subComps);
                            }
                            else {
                                components.push(child);
                            }
                        }
                    }

                    return components;
                }

                this.getObjectTree(function (result) {

                    var allLeafComponents = getLeafComponentsRec(result);

                    callback(allLeafComponents);
                });
            };

        ///////////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////////
        Autodesk.Viewing.Viewer.prototype.startExplodeMotion =

            function (speed, min, max) {

                this.stopExplodeMotion();

                var viewer = this;

                var scale = min;

                var watch = new Stopwatch();

                this.explodeMotion = setInterval(function () {

                    scale += speed * 0.001 * watch.getElapsedMs();

                    if(scale > max) {

                        scale = max;
                        speed = -speed;
                    }

                    else if (scale < min) {

                        scale = min;
                        speed = -speed;
                    }

                    viewer.explode(scale);

                }, 100);
            }

        Autodesk.Viewing.Viewer.prototype.stopExplodeMotion =

            function () {

                if(this.hasOwnProperty("explodeMotion")){

                    clearInterval(this.explodeMotion);
                }

                delete this.explodeMotion;

                this.explode(0);
            }

        ///////////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////////
        Autodesk.Viewing.Viewer.prototype.startRotateMotion =

            function (speed, axis) {

                this.stopRotateMotion();

                var viewer = this;

                var watch = new Stopwatch();

                this.rotateMotion = setInterval(function () {

                    var view = viewer.getCurrentView('animate');

                    var position = new THREE.Vector3(
                        view.position.x,
                        view.position.y,
                        view.position.z
                    );

                    var rAxis = new THREE.Vector3(
                        axis.x, axis.y, axis.z
                    );

                    var matrix = new THREE.Matrix4().makeRotationAxis(
                        rAxis,
                            speed * 0.001 * watch.getElapsedMs());

                    position.applyMatrix4(matrix);

                    viewer.navigation.setPosition(position);

                }, 100);
            }

        Autodesk.Viewing.Viewer.prototype.stopRotateMotion =

            function () {

                if(this.hasOwnProperty("rotateMotion")){

                    clearInterval(this.rotateMotion);
                }

                delete this.rotateMotion;
            }

        return true;
    };

    _self.unload = function () {

        console.log('Autodesk.ADN.Viewing.Extension.API unloaded');
        return true;
    };
};

Autodesk.ADN.Viewing.Extension.API.prototype =
    Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.API.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.API;

Autodesk.Viewing.theExtensionManager.registerExtension(
    'Autodesk.ADN.Viewing.Extension.API',
    Autodesk.ADN.Viewing.Extension.API);
