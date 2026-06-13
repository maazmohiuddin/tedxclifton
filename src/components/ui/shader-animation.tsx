"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

    // TEDxClifton red/gold-toned concentric ring shader
    // Base palette: #0A0204 (ink) → #EB0028 (TED red) → #F5D08A (gold)
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        float lineWidth = 0.0022;

        // Raw ring accumulation per channel
        vec3 raw = vec3(0.0);
        for (int j = 0; j < 3; j++) {
          for (int i = 0; i < 5; i++) {
            raw[j] += lineWidth * float(i * i) / abs(
              fract(t - 0.008 * float(j) + float(i) * 0.01) * 5.0
              - length(uv)
              + mod(uv.x + uv.y, 0.2)
            );
          }
        }

        // Luminance of raw output
        float lum = (raw.r + raw.g + raw.b) / 3.0;

        // Map luminance → TEDxClifton red palette
        // dark:  #02040A  = vec3(0.008, 0.016, 0.039)
        // mid:   #0F2560  = vec3(0.059, 0.145, 0.376)
        // blue:  #316BFF  = vec3(0.192, 0.420, 1.000)
        // soft:  #8FAFFF  = vec3(0.561, 0.686, 1.000)
        vec3 c0 = vec3(0.039, 0.008, 0.016); // near-black (warm)
        vec3 c1 = vec3(0.227, 0.039, 0.071); // deep maroon
        vec3 c2 = vec3(0.922, 0.000, 0.157); // TED red
        vec3 c3 = vec3(0.961, 0.816, 0.541); // gold highlight

        vec3 color;
        if (lum < 0.15) {
          color = mix(c0, c1, smoothstep(0.0, 0.15, lum));
        } else if (lum < 0.45) {
          color = mix(c1, c2, smoothstep(0.15, 0.45, lum));
        } else {
          color = mix(c2, c3, smoothstep(0.45, 1.0, clamp(lum, 0.0, 1.0)));
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `

    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      time:       { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
    }
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    scene.add(new THREE.Mesh(geometry, material))

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height)
    }
    resize()
    window.addEventListener("resize", resize, false)

    let id = 0
    const animate = () => {
      id = requestAnimationFrame(animate)
      uniforms.time.value += 0.05
      renderer.render(scene, camera)
      if (sceneRef.current) sceneRef.current.animationId = id
    }

    sceneRef.current = { renderer, animationId: 0 }
    animate()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(id)
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#0A0204", overflow: "hidden" }}
    />
  )
}
