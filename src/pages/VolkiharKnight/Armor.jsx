import './Armor.css';

import { spring, value } from 'popmotion';
import { useCallback, useEffect, useRef, useState } from 'react';
import Helmet from 'react-helmet';
import { Transition } from 'react-transition-group';
import {
  ACESFilmicToneMapping,
  CubeTextureLoader,
  DirectionalLight,
  Group,
  PMREMGenerator,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  sRGBEncoding,
} from 'three';
import { degToRad } from 'three/src/math/MathUtils';
import vknx from '@/assets/volkihar-cube-nx.jpg';
import vkny from '@/assets/volkihar-cube-ny.jpg';
import vknz from '@/assets/volkihar-cube-nz.jpg';
import vkpx from '@/assets/volkihar-cube-px.jpg';
import vkpy from '@/assets/volkihar-cube-py.jpg';
import vkpz from '@/assets/volkihar-cube-pz.jpg';
import armor from '@/assets/volkihar-knight.glb';
import { Loader } from '@/components/Loader';
import { tokens } from '@/components/ThemeProvider/theme';
import { useInViewport, usePrefersReducedMotion } from '@/hooks';
import { classes, cssProps, msToNum, numToMs } from '@/utils/style';
import { cleanRenderer, cleanScene, modelLoader, removeLights } from '@/utils/three';

const Armor = ({
  models,
  show = true,
  showDelay = 0,
  cameraPosition = { x: 0, y: 0, z: 6 },
  enableControls,
  className,
  alt,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const container = useRef();
  const canvas = useRef();
  const camera = useRef();
  const modelGroup = useRef();
  const scene = useRef();
  const renderer = useRef();
  const lights = useRef();
  const isInViewport = useInViewport(container, false, { threshold: 0.4 });
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const { clientWidth, clientHeight } = container.current;

    renderer.current = new WebGLRenderer({
      canvas: canvas.current,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });

    renderer.current.setPixelRatio(2);
    renderer.current.setSize(clientWidth, clientHeight);
    renderer.current.outputEncoding = sRGBEncoding;
    renderer.current.physicallyCorrectLights = true;
    renderer.current.toneMapping = ACESFilmicToneMapping;

    camera.current = new PerspectiveCamera(36, clientWidth / clientHeight, 0.1, 100);
    camera.current.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    scene.current = new Scene();

    const cubeTextureLoader = new CubeTextureLoader();
    modelGroup.current = new Group();
    scene.current.add(modelGroup.current);

    const pmremGenerator = new PMREMGenerator(renderer.current);
    pmremGenerator.compileCubemapShader();

    // Lighting
    const keyLight = new DirectionalLight(0xffffff, 3.2);
    const fillLight = new DirectionalLight(0xffffff, 1.0);
    const backLight = new DirectionalLight(0xffffff, 1.0);

    keyLight.position.set(1, 0.1, 2);
    fillLight.position.set(-1, 0.1, 8);
    backLight.position.set(-2, 2, -3);
    lights.current = [backLight, keyLight, fillLight];
    lights.current.forEach(light => scene.current.add(light));

    const load = async () => {
      const loadGltf = modelLoader.loadAsync(armor);
      const loadEnv = cubeTextureLoader.loadAsync([vknx, vkny, vknz, vkpx, vkpy, vkpz]);

      const [gltf, envTexture] = await Promise.all([loadGltf, loadEnv]);

      modelGroup.current.add(gltf.scene);
      gltf.scene.rotation.y = degToRad(180);
      gltf.scene.position.y = -1.6;

      const { texture } = pmremGenerator.fromCubemap(envTexture);
      scene.current.environment = texture;
      pmremGenerator.dispose();

      setLoaded(true);
      renderFrame();
    };

    setTimeout(load, 1000);
    setTimeout(() => {
      setLoaderVisible(true);
    }, 2000);

    return () => {
      removeLights(lights.current);
      cleanScene(scene.current);
      cleanRenderer(renderer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle render passes for a single frame
  const renderFrame = useCallback(() => {
    renderer.current.render(scene.current, camera.current);
  }, []);

  // Handle mouse move animation
  useEffect(() => {
    let rotationSpring;
    let rotationSpringValue;

    const onMouseMove = event => {
      const { rotation } = modelGroup.current;
      const { innerWidth, innerHeight } = window;

      const position = {
        x: (event.clientX - innerWidth / 2) / innerWidth,
        y: (event.clientY - innerHeight / 2) / innerHeight,
      };

      if (!rotationSpringValue) {
        rotationSpringValue = value({ x: rotation.x, y: rotation.y }, ({ x, y }) => {
          rotation.set(x, y, rotation.z);
          renderFrame();
        });
      }

      rotationSpring = spring({
        from: rotationSpringValue.get(),
        to: { x: position.y / 2, y: position.x / 2 },
        stiffness: 40,
        damping: 40,
        velocity: rotationSpringValue.getVelocity(),
        restSpeed: 0.00001,
        mass: 1.4,
      }).start(rotationSpringValue);
    };

    if (isInViewport && !reduceMotion) {
      window.addEventListener('mousemove', onMouseMove);
      setVisible(true);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      rotationSpring?.stop();
    };
  }, [isInViewport, reduceMotion, renderFrame]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!container.current) return;

      const { clientWidth, clientHeight } = container.current;

      renderer.current.setSize(clientWidth, clientHeight);
      camera.current.aspect = clientWidth / clientHeight;
      camera.current.updateProjectionMatrix();

      renderFrame();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [renderFrame]);

  return (
    <>
      <Helmet>
        <link rel="prefetch" href={armor} as="fetch" crossorigin="" />
      </Helmet>
      <div
        className={classes('armor', className)}
        ref={container}
        role="img"
        aria-label={alt}
        {...rest}
      >
        <Transition
          mountOnEnter
          unmountOnExit
          in={!loaded && loaderVisible}
          timeout={msToNum(tokens.base.durationL)}
        >
          {status => <Loader className="armor__loader" data-status={status} />}
        </Transition>
        <canvas
          className="armor__canvas"
          ref={canvas}
          data-loaded={loaded && visible}
          style={cssProps({ delay: numToMs(showDelay) })}
        />
      </div>
    </>
  );
};

export default Armor;
