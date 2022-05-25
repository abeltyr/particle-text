const vertexShader = () => {
  return `
    #define PI 3.1415926535897932384626433832795
    attribute float size;
    attribute float show;
    attribute vec3 customColor;
    attribute float count;
    uniform vec3 raycasterDistance;
    uniform bool randomize;
    uniform bool done;
    uniform float particleSize;
    uniform float ease;
    uniform float area;
    uniform float factor;
    uniform float elapsedTime;
    varying vec3 vColor;

    float distance(float x1, float y1, float x2, float y2) {
        return sqrt(pow((x2 - x1), 2.0) + pow((y2 - y1), 2.0));
    }

    float random (in vec2 st) {
        return fract(sin(dot(st.xy,
                            vec2(12.9898,78.233)))
                    * 43758.5453123);
    }

    void main() {

        float initX = position.x;
        float initY = position.y;
        float initZ = position.z;

        float px = position.x;
        float py = position.y;
        float pz = position.z;

        vec3 newColor =  vec3(0.23529411764705882, 0.6, 0.5411764705882353);
        
        vec4 data = modelViewMatrix * vec4(position,1.0);

        float sizeData = size * ( 500.0 / -data.z );

        float dx = raycasterDistance.x - px;
        float dy = raycasterDistance.y - py;

        float mouseDistance = distance(
            raycasterDistance.x, 
            raycasterDistance.y, 
            px, 
            py
        );

        float secondDistance = 
        ((raycasterDistance.x -px ) * (raycasterDistance.x -px)) +
        ((raycasterDistance.y -py) * (raycasterDistance.y -py));

        float floatingArea = -area/mouseDistance;
        float floatingArea1 = -area/secondDistance  ;

        float angle = atan(dy ,dx) ;
        
        if(factor < 2000.0 && !done){
            float sizeAdjustment = randomize ?0.8:1.2;
            float factorMultiple = factor <1000.0 ?50.0:5.0;
            // px -= cos(random(vec2(px,py))*elapsedTime) * 4.0 *elapsedTime /factor;
            // py -= sin(random(vec2(px,py))*elapsedTime) * 4.0 *elapsedTime /factor;

            px -= cos(angle) *elapsedTime*(50.0) /(factor * factorMultiple)  ;
            py -= sin(angle) *elapsedTime*(50.0)/(factor *factorMultiple   );
            sizeData = size * sizeAdjustment * ( 500.0 / -data.z );  
        }
         if(show == 1.0){
            px += 0.5 * cos(angle);
            py += 0.5 * sin(angle);
            sizeData = size/ 1.8 * ( 500.0 / -data.z ) ;
        }
        else if(done){
            // px -= cos(elapsedTime*angle) *elapsedTime*(floatingArea1) /20.0 ;
            // py -= sin(elapsedTime*angle) *elapsedTime*(floatingArea1)/20.0 ;
            px -= cos(angle) *elapsedTime*(50.0) /( 50.0)  ;
            py -= sin(angle) *elapsedTime*(50.0)/(50.0   );
            sizeData = size * 1.2 * ( 500.0 / -data.z );  
            // newColor = vec3(0.25 , 0.3  , 0.35 ); 
            if (
                px > initX + 5.0 ||
                px < initX - 5.0 ||
                py > initY + 5.0 ||
                py < initY - 5.0
            ) { 
                // newColor = vec3(0.25 , 0.3  , 0.35 ); 
                sizeData = size * 1.2 * ( 500.0 / -data.z );
            }
            if (
                px > initX + 50.0 ||
                px < initX - 50.0 ||
                py > initY + 50.0 ||
                py < initY - 50.0
            ) { 
                sizeData = size * 0.2 * ( 500.0 / -data.z );
            }
        }
        px  += (initX - px) * ease;
        py  += (initY - py) * ease;
        pz  += (initZ - pz) * ease;
        vColor = newColor;
        vec4 mvPosition = modelViewMatrix * vec4(vec3(px,py,pz), 1.0 );
        gl_PointSize = sizeData;
        gl_Position = projectionMatrix * mvPosition;
    }
`;
};

export default vertexShader;
