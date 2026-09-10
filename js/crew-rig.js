// A small GPU deformation rig keeps the painted fur and clothing intact while
// articulating limbs. All six sprites render into one reusable texture atlas.
const NAMES = ["engineer", "operator", "sleeper", "kitten", "stoker", "pilot"];
const CELL = 256;
const PAD = 0.08;
const VERTEX = `
attribute vec2 position;
varying vec2 point;
void main() {
  point = (position * .5 + .5) * 1.16 - .08;
  gl_Position = vec4(position.x, -position.y, 0., 1.);
}`;
const FRAGMENT = `
precision highp float;
uniform sampler2D image;
uniform vec4 crop;
uniform vec2 sheetSize;
uniform float time;
uniform float kind;
uniform vec2 gaze;
uniform float happy;
uniform float startled;
uniform float speed;
varying vec2 point;
mat2 turn(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
float region(vec2 center, vec2 radius) {
  return 1. - smoothstep(.45, 1., length((point - center) / radius));
}
vec2 bend(vec2 q, vec2 center, vec2 radius, vec2 joint, float angle) {
  return mix(q, joint + turn(-angle) * (q - joint), region(center, radius));
}
vec2 eye(vec2 q, vec2 center, vec2 radius, float blink) {
  float weight = region(center, radius);
  vec2 samplePoint = q - gaze * vec2(.0015, .001);
  samplePoint.y = center.y + clamp((samplePoint.y - center.y) / max(.06, 1. - blink), -radius.y, radius.y);
  return mix(q, samplePoint, weight);
}
void main() {
  vec2 q = point;
  float cycle = mod(time + kind * 1.13, 5.8);
  float blink = smoothstep(5.53, 5.65, cycle) * (1. - smoothstep(5.65, 5.8, cycle));
  blink = max(blink * (1. - startled), happy * .88);
  if (kind < .5) {
    // Engineer: forearm and wrench turn about the elbow; the tail curls.
    q = bend(q, vec2(.90,.40), vec2(.22,.31), vec2(.82,.62), sin(time*5.)*.19);
    q = bend(q, vec2(.15,.86), vec2(.27,.18), vec2(.34,.90), sin(time*2.1)*.16);
    q = bend(q, vec2(.61,.20), vec2(.36,.25), vec2(.59,.38), gaze.x*.006 + sin(time*1.5)*.01);
    q = eye(q, vec2(.638,.188), vec2(.027,.024), blink);
    q = eye(q, vec2(.753,.182), vec2(.025,.024), blink);
  } else if (kind < 1.5) {
    // Operator: the reaching paw taps faster when the telegraph is clicked.
    q = bend(q, vec2(.78,.54), vec2(.32,.20), vec2(.52,.62), max(0.,sin(time*9.*speed))*.20);
    q = bend(q, vec2(.20,.88), vec2(.27,.17), vec2(.37,.89), sin(time*2.3)*.10);
    q = bend(q, vec2(.66,.22), vec2(.32,.28), vec2(.56,.40), gaze.x*.006 + sin(time*2.)*.016);
  } else if (kind < 2.5) {
    // Sleeper: slow ribcage breathing, with an occasional tail-tip twitch.
    q.y = 1. - (1. - q.y) / (1. + sin(time*1.8)*.018);
    q = bend(q, vec2(.76,.78), vec2(.26,.20), vec2(.70,.73), sin(time*5.)*.02);
  } else if (kind < 3.5) {
    // Kitten: opposing front/hind strides and an independent tail swing.
    q = bend(q, vec2(.78,.82), vec2(.27,.25), vec2(.65,.62), sin(time*16.)*.28);
    q = bend(q, vec2(.24,.78), vec2(.27,.25), vec2(.34,.59), -sin(time*16.)*.26);
    q = bend(q, vec2(.19,.25), vec2(.18,.32), vec2(.24,.54), sin(time*7.)*.20);
    q = eye(q, vec2(.914,.384), vec2(.023,.034), blink);
  } else if (kind < 4.5) {
    // Stoker: both paws and the coal shovel move together along its handle.
    float tool = (1.-smoothstep(.08,.16,abs(point.y-(.50+.31*point.x)))) * smoothstep(.02,.12,point.x);
    q = mix(q, vec2(.27,.61) + turn(-sin(time*3.8)*.105) * (q-vec2(.27,.61)),tool);
    q = bend(q,vec2(.055,.61),vec2(.15,.21),vec2(.15,.67),sin(time*11.)*.25);
    q = bend(q,vec2(.56,.22),vec2(.28,.25),vec2(.50,.36),sin(time*3.8)*-.018);
    q = eye(q,vec2(.586,.169),vec2(.025,.03),blink);
  } else {
    // Pilot: head follows the view and the scarf flutters behind the collar.
    q = bend(q,vec2(.54,.35),vec2(.46,.40),vec2(.48,.69),sin(time*1.9)*.025+gaze.x*.005);
    q = bend(q,vec2(.83,.85),vec2(.24,.20),vec2(.65,.75),sin(time*6.)*.07);
    q = eye(q,vec2(.429,.280),vec2(.04,.035),blink);
    q = eye(q,vec2(.645,.300),vec2(.035,.03),blink);
  }
  if (q.x < 0. || q.y < 0. || q.x > 1. || q.y > 1.) discard;
  gl_FragColor = texture2D(image, (crop.xy + q * crop.zw) / sheetSize);
}`;

function shader(gl, type, source) {
  const handle = gl.createShader(type);
  gl.shaderSource(handle, source);
  gl.compileShader(handle);
  if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS)) {
    throw new Error(`Crew shader: ${gl.getShaderInfoLog(handle)}`);
  }
  return handle;
}

export function createCrewRig(image, frames) {
  const canvas = document.createElement("canvas");
  canvas.width = CELL * 3;
  canvas.height = CELL * 2;
  const gl = canvas.getContext("webgl", {alpha:true, premultipliedAlpha:false, antialias:false, preserveDrawingBuffer:true});
  if (!gl) return null;
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, shader(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(gl.getUniformLocation(program, "image"), 0);
  const uniform = Object.fromEntries(["crop","sheetSize","time","kind","gaze","happy","startled","speed"].map(name=>[name,gl.getUniformLocation(program,name)]));
  gl.uniform2f(uniform.sheetSize, image.width, image.height);
  let ready = false;
  return {
    available() { return !gl.isContextLost(); },
    render(t, states) {
      if (gl.isContextLost()) { ready = false; return; }
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniform.time, t / 1000);
      NAMES.forEach((name,index) => {
        const state = states[name] ?? {};
        const [x,y,w,h] = frames[name].crop;
        gl.viewport(index % 3 * CELL, (1 - Math.floor(index / 3)) * CELL, CELL, CELL);
        gl.uniform4f(uniform.crop,x,y,w,h);
        gl.uniform1f(uniform.kind,index);
        gl.uniform2f(uniform.gaze,state.x ?? 0,state.y ?? 0);
        gl.uniform1f(uniform.happy,state.happy ? 1 : 0);
        gl.uniform1f(uniform.startled,state.startle ? 1 : 0);
        gl.uniform1f(uniform.speed,state.speed ?? 1);
        gl.drawArrays(gl.TRIANGLES,0,6);
      });
      ready = true;
    },
    draw(ctx, name, box) {
      if (!ready) return false;
      const index = NAMES.indexOf(name);
      ctx.drawImage(canvas, index % 3 * CELL, Math.floor(index / 3) * CELL, CELL, CELL,
        box.x - box.w * PAD, box.y - box.h * PAD, box.w * (1 + PAD * 2), box.h * (1 + PAD * 2));
      return true;
    },
  };
}
