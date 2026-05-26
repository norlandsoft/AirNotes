/**
 * 登录页面组件
 *
 * 深空星野背景 + 透视网格地面 + 地平线光晕。
 * 居中卡片布局，顶部居中Logo，下方表单区域。
 * 使用air-design组件库，密码直接传入model层进行SHA256加密。
 *
 * 配色：暖琥珀色调（区别于 AirDirector 的青碧色调）
 *
 * @author ChaiMingXu
 * @since 2026/5/26
 */
import React, {useEffect, useRef} from 'react';
import {connect} from 'umi';
import {Form, Input, ConfigProvider} from 'air-design';
import './index.less';

const Login: React.FC<any> = props => {
  const {dispatch, loading} = props;
  const [form] = Form.useForm();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 星野背景动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    interface Star { x: number; y: number; r: number; alpha: number; twinkle: number; phase: number }
    let stars: Star[] = [];

    const initStars = () => {
      stars = [];
      const count = Math.floor(width * height / 2800);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.7,
          r: Math.random() < 0.08 ? 1.2 + Math.random() * 0.6 : 0.3 + Math.random() * 0.6,
          alpha: 0.15 + Math.random() * 0.5,
          twinkle: 0.5 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };
    initStars();

    // 星云薄雾参数 — 暖琥珀色调
    const nebulae = [
      {baseX: 0.2, baseY: 0.25, radius: 300, phase: 0, freq: 0.15, color: [80, 50, 20]},
      {baseX: 0.75, baseY: 0.3, radius: 260, phase: 2.0, freq: 0.12, color: [90, 60, 25]},
      {baseX: 0.5, baseY: 0.15, radius: 350, phase: 4.0, freq: 0.1, color: [70, 45, 18]},
    ];

    interface Dust { x: number; y: number; speed: number; size: number; alpha: number; wobble: number; offset: number }
    let dust: Dust[] = [];

    const initDust = () => {
      dust = Array.from({length: 30}, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.06 + Math.random() * 0.18,
        size: 0.3 + Math.random() * 1.0,
        alpha: 0.03 + Math.random() * 0.1,
        wobble: 0.3 + Math.random() * 1.0,
        offset: Math.random() * Math.PI * 2,
      }));
    };
    initDust();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initStars();
      initDust();
    };
    window.addEventListener('resize', handleResize);

    let time = 0;

    const animate = () => {
      time += 0.001;
      const horizonY = height * 0.68;
      const vpx = width / 2;

      // 深空背景渐变 — 暖琥珀色调
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0c0804');
      bgGrad.addColorStop(0.35, '#1a0f08');
      bgGrad.addColorStop(0.65, '#24160e');
      bgGrad.addColorStop(1, '#1a0f08');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 星云薄雾
      nebulae.forEach((n, i) => {
        const nx = n.baseX * width + Math.sin(time * n.freq + n.phase) * 40;
        const ny = n.baseY * height + Math.cos(time * n.freq * 0.7 + n.phase) * 25;
        const nr = n.radius + Math.sin(time * 0.8 + i) * 20;
        const [cr, cg, cb] = n.color;
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.16)`);
        grad.addColorStop(0.4, `rgba(${cr}, ${cg}, ${cb}, 0.06)`);
        grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      });

      // 星野闪烁
      stars.forEach(s => {
        const flicker = 0.7 + Math.sin(time * s.twinkle + s.phase) * 0.3;
        ctx.fillStyle = `rgba(255, 210, 160, ${s.alpha * flicker})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 透视网格地面
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, horizonY, width, height - horizonY);
      ctx.clip();
      const ga = 0.022 + Math.sin(time * 1.5) * 0.004;
      ctx.strokeStyle = `rgba(150, 100, 50, ${ga})`;
      ctx.lineWidth = 0.5;
      for (let i = -20; i <= 20; i++) {
        const bottomX = vpx + (i / 20) * width * 0.8;
        const topX = vpx + (i / 20) * 20;
        ctx.beginPath();
        ctx.moveTo(bottomX, height);
        ctx.lineTo(topX, horizonY);
        ctx.stroke();
      }
      for (let i = 1; i <= 16; i++) {
        const t = Math.pow(i / 16, 1.7);
        const y = horizonY + (height - horizonY) * t;
        const spread = t * width * 0.7;
        ctx.beginPath();
        ctx.moveTo(vpx - spread, y);
        ctx.lineTo(vpx + spread, y);
        ctx.stroke();
      }
      ctx.restore();

      // 地平线光晕
      const glowH = 100;
      const hGlow = ctx.createLinearGradient(0, horizonY - glowH, 0, horizonY + glowH);
      hGlow.addColorStop(0, 'rgba(80, 50, 20, 0)');
      hGlow.addColorStop(0.5, 'rgba(180, 120, 60, 0.04)');
      hGlow.addColorStop(1, 'rgba(80, 50, 20, 0)');
      ctx.fillStyle = hGlow;
      ctx.fillRect(0, horizonY - glowH, width, glowH * 2);

      // 地平线发光线
      const la = 0.16 + Math.sin(time * 2) * 0.03;
      const lGrad = ctx.createLinearGradient(0, horizonY, width, horizonY);
      lGrad.addColorStop(0, 'rgba(180, 130, 60, 0)');
      lGrad.addColorStop(0.15, `rgba(180, 130, 60, ${la * 0.3})`);
      lGrad.addColorStop(0.5, `rgba(200, 150, 70, ${la})`);
      lGrad.addColorStop(0.85, `rgba(180, 130, 60, ${la * 0.3})`);
      lGrad.addColorStop(1, 'rgba(180, 130, 60, 0)');
      ctx.fillStyle = lGrad;
      ctx.fillRect(0, horizonY - 0.5, width, 1);

      // 漂浮星尘
      dust.forEach(p => {
        p.y -= p.speed;
        p.x += Math.sin(time * p.wobble + p.offset) * 0.12;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        const zone = p.y > horizonY ? 0.2 : 1;
        ctx.fillStyle = `rgba(200, 160, 100, ${p.alpha * zone})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogin = (values: any) => {
    dispatch({
      type: 'user/login',
      payload: {
        id: values.id,
        password: values.password
      }
    });
  };

  return (
    <ConfigProvider prefixCls="air">
      <div className="air-login-page">
        <canvas ref={canvasRef} className="air-login-canvas"/>

        <div className="air-login-card">
          <div className="air-login-header">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.75 3.5V2C8.75 1.59 8.41 1.25 8 1.25C7.59 1.25 7.25 1.59 7.25 2V3.56C7.5 3.53 7.73 3.5 8 3.5H8.75Z" fill="#c17f3e"/>
              <path d="M16.75 3.56V2C16.75 1.59 16.41 1.25 16 1.25C15.59 1.25 15.25 1.59 15.25 2V3.5H16C16.27 3.5 16.5 3.53 16.75 3.56Z" fill="#c17f3e"/>
              <path d="M16.75 3.56V5C16.75 5.41 16.41 5.75 16 5.75C15.59 5.75 15.25 5.41 15.25 5V3.5H8.75V5C8.75 5.41 8.41 5.75 8 5.75C7.59 5.75 7.25 5.41 7.25 5V3.56C4.3 3.83 3 5.73 3 8.5V17C3 20 4.5 22 8 22H16C19.5 22 21 20 21 17V8.5C21 5.73 19.7 3.83 16.75 3.56ZM12 16.75H8C7.59 16.75 7.25 16.41 7.25 16C7.25 15.59 7.59 15.25 8 15.25H12C12.41 15.25 12.75 15.59 12.75 16C12.75 16.41 12.41 16.75 12 16.75ZM16 11.75H8C7.59 11.75 7.25 11.41 7.25 11C7.25 10.59 7.59 10.25 8 10.25H16C16.41 10.25 16.75 10.59 16.75 11C16.75 11.41 16.41 11.75 16 11.75Z" fill="#c17f3e"/>
            </svg>
            <span className="air-login-logo-text">AirNotes</span>
          </div>
          <div className="air-login-tagline">Wiki Knowledge Base</div>

          <Form form={form} onFinish={handleLogin} className="air-login-form">
            <Form.Item name="id" rules={[{required: true, message: '请输入用户名'}]}>
              <Input placeholder="用户名"/>
            </Form.Item>
            <Form.Item name="password" rules={[{required: true, message: '请输入密码'}]}>
              <Input.Password placeholder="密码"/>
            </Form.Item>
            <Form.Item className="air-login-btn-item">
              <button type="submit" className="air-login-btn" disabled={loading}>
                {loading ? '登录中...' : '登 录'}
              </button>
            </Form.Item>
          </Form>
        </div>

        <div className="air-login-footer">&copy; {new Date().getFullYear()} Norlandsoft</div>
      </div>
    </ConfigProvider>
  );
};

export default connect(({user}: any) => ({
  loading: user.loading,
  isAuthenticated: user.isAuthenticated,
}))(Login);
