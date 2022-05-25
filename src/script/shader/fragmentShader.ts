const fragmentShader = () => {
  return `
    uniform vec3 color;
    uniform sampler2D pointTexture;
    
    varying vec3 vColor;
    
    void main() {
        gl_FragColor = vec4((vColor ) , 1.0 );
        gl_FragColor = gl_FragColor * vec4(vColor, 1.0) * texture2D( pointTexture, gl_PointCoord );
    
    }
`;
};

export default fragmentShader;
