/**
 * The maths an EM course assumes, on one sheet: algebra and trig, units, derivatives, integrals and the techniques
 * for choosing them, multiple integrals with their volume and surface elements, and vectors. Standard results;
 * the notes say when to reach for each one.
 */
export type ToolkitItem = { title: string; latex: string; note?: string };
export const mathToolkit: { section: string; items: ToolkitItem[] }[] = [
  {
    section: "Algebra and trigonometry",
    items: [
      { title: "Pythagoras and distance", latex: String.raw`c^2=a^2+b^2,\qquad R=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}`, note: "The distance R between two points is Pythagoras in three dimensions." },
      { title: "Right-angled triangle", latex: String.raw`\sin\theta=\dfrac{\text{opp}}{\text{hyp}},\quad \cos\theta=\dfrac{\text{adj}}{\text{hyp}},\quad \tan\theta=\dfrac{\text{opp}}{\text{adj}}` },
      { title: "Identities", latex: String.raw`\sin^2\theta+\cos^2\theta=1,\quad \sin2\theta=2\sin\theta\cos\theta,\quad \cos2\theta=1-2\sin^2\theta` },
      { title: "Squares of sine and cosine", latex: String.raw`\sin^2\theta=\tfrac12(1-\cos2\theta),\qquad \cos^2\theta=\tfrac12(1+\cos2\theta)`, note: "Use these to integrate sin² or cos²." },
      { title: "Radians", latex: String.raw`\pi\ \text{rad}=180^\circ,\qquad \theta_{\text{rad}}=\theta_{\text{deg}}\cdot\dfrac{\pi}{180}`, note: "Calculus formulas need radians." },
      { title: "Exponentials and logs", latex: String.raw`e^{a}e^{b}=e^{a+b},\quad \ln(ab)=\ln a+\ln b,\quad \ln\dfrac ab=\ln a-\ln b,\quad e^{\ln x}=x` },
    ],
  },
  {
    section: "Units and notation",
    items: [
      { title: "SI prefixes", latex: String.raw`\text{p}=10^{-12},\ \text{n}=10^{-9},\ \mu=10^{-6},\ \text{m}=10^{-3},\ \text{c}=10^{-2},\ \text{k}=10^{3},\ \text{M}=10^{6},\ \text{G}=10^{9}` },
      { title: "Squared and cubed units", latex: String.raw`1\ \text{cm}^2=10^{-4}\ \text{m}^2,\quad 1\ \text{mm}^2=10^{-6}\ \text{m}^2,\quad 1\ \text{cm}^3=10^{-6}\ \text{m}^3`, note: "The prefix is squared or cubed with the unit." },
      { title: "Check units", latex: String.raw`[\mathbf E]=\text{V/m}=\text{N/C},\quad [\mathbf D]=\text{C/m}^2,\quad [\mathbf H]=\text{A/m},\quad [\mathbf B]=\text{T}=\text{Wb/m}^2`, note: "If the units of an answer are wrong, the working is wrong." },
    ],
  },
  {
    section: "Differentiation",
    items: [
      { title: "Basic derivatives", latex: String.raw`\dfrac{d}{dx}x^n=nx^{n-1},\quad \dfrac{d}{dx}e^{ax}=ae^{ax},\quad \dfrac{d}{dx}\ln x=\dfrac1x` },
      { title: "Trig derivatives", latex: String.raw`\dfrac{d}{dx}\sin ax=a\cos ax,\qquad \dfrac{d}{dx}\cos ax=-a\sin ax` },
      { title: "Product and quotient rules", latex: String.raw`(uv)'=u'v+uv',\qquad \left(\dfrac uv\right)'=\dfrac{u'v-uv'}{v^2}` },
      { title: "Chain rule", latex: String.raw`\dfrac{d}{dx}f(g(x))=f'(g(x))\,g'(x)`, note: "Differentiate the outside, keep the inside, multiply by the inside's derivative." },
      { title: "Partial derivatives", latex: String.raw`\dfrac{\partial}{\partial x}(x^2y^3)=2xy^3,\qquad \dfrac{\partial}{\partial y}(x^2y^3)=3x^2y^2`, note: "Treat every other variable as a constant. Gradient, divergence and curl are built from these." },
    ],
  },
  {
    section: "Integration",
    items: [
      { title: "Basic integrals", latex: String.raw`\int x^n\,dx=\dfrac{x^{n+1}}{n+1}\ (n\ne-1),\quad \int\dfrac{dx}{x}=\ln|x|,\quad \int e^{ax}dx=\dfrac{e^{ax}}{a}` },
      { title: "Trig integrals", latex: String.raw`\int\sin ax\,dx=-\dfrac{\cos ax}{a},\quad \int\cos ax\,dx=\dfrac{\sin ax}{a},\quad \int\sin^2\theta\,d\theta=\dfrac\theta2-\dfrac{\sin2\theta}{4}` },
      { title: "Angles you meet every time", latex: String.raw`\int_0^{2\pi}d\phi=2\pi,\quad \int_0^{\pi}\sin\theta\,d\theta=2,\quad \int_0^{2\pi}\sin\phi\,d\phi=\int_0^{2\pi}\cos\phi\,d\phi=0`, note: "Many flux integrals collapse to these." },
      { title: "Substitution", latex: String.raw`\int f(g(x))\,g'(x)\,dx=\int f(u)\,du,\qquad u=g(x)`, note: "Use it when the derivative of an inside function is sitting next to it." },
      { title: "Integration by parts", latex: String.raw`\int u\,dv=uv-\int v\,du`, note: "Choose u as the part that gets simpler when differentiated (a power of x), dv as the part you can integrate (e^x, sin x)." },
      { title: "Let the Jacobian do the work", latex: String.raw`\int_0^{a}e^{-\rho^2}\,\rho\,d\rho=\Big[-\tfrac12e^{-\rho^2}\Big]_0^{a}=\tfrac12\big(1-e^{-a^2}\big)`, note: "The ρ from dS = ρ dρ dφ is exactly the derivative of ρ² (up to a factor), so a plain substitution works and no integration by parts is needed. Choosing coordinates that match the symmetry often supplies that factor." },
      { title: "Line-charge integrals", latex: String.raw`\int\dfrac{dz}{(z^2+a^2)^{3/2}}=\dfrac{z}{a^2\sqrt{z^2+a^2}},\qquad \int\dfrac{z\,dz}{(z^2+a^2)^{3/2}}=-\dfrac{1}{\sqrt{z^2+a^2}}`, note: "These appear in E and H of a finite line." },
    ],
  },
  {
    section: "Multiple integrals and elements",
    items: [
      { title: "Volume elements", latex: String.raw`dv=dx\,dy\,dz=\rho\,d\rho\,d\phi\,dz=r^2\sin\theta\,dr\,d\theta\,d\phi`, note: "Cartesian for boxes, cylindrical for anything with an axis, spherical for spheres and point charges." },
      { title: "Surface elements", latex: String.raw`\text{disc: }dS=\rho\,d\rho\,d\phi,\quad \text{cylinder side: }dS=\rho\,d\phi\,dz,\quad \text{sphere: }dS=r^2\sin\theta\,d\theta\,d\phi` },
      { title: "Line elements", latex: String.raw`d\mathbf L=dx\,\mathbf a_x+dy\,\mathbf a_y+dz\,\mathbf a_z=d\rho\,\mathbf a_\rho+\rho\,d\phi\,\mathbf a_\phi+dz\,\mathbf a_z` },
      { title: "Separable integrals", latex: String.raw`\int_0^{2\pi}\!\!\int_0^{\pi}\!\!\int_0^{a}f(r)\,g(\theta)\,r^2\sin\theta\,dr\,d\theta\,d\phi=\Big(\int_0^{a}f\,r^2dr\Big)\Big(\int_0^{\pi}g\sin\theta\,d\theta\Big)(2\pi)`, note: "When the limits are constants and the integrand is a product, split it into single integrals." },
      { title: "Order of integration", latex: String.raw`\int_{x=0}^{1}\int_{y=0}^{x}f\,dy\,dx=\int_{y=0}^{1}\int_{x=y}^{1}f\,dx\,dy`, note: "Integrate first over the variable whose limits depend on the others; swap the order if the inner integral is hard." },
      { title: "Standard results", latex: String.raw`V_{\text{sphere}}=\tfrac43\pi r^3,\quad A_{\text{sphere}}=4\pi r^2,\quad A_{\text{cyl side}}=2\pi\rho L,\quad A_{\text{disc}}=\pi a^2` },
    ],
  },
  {
    section: "Vectors",
    items: [
      { title: "Magnitude and unit vector", latex: String.raw`|\mathbf A|=\sqrt{A_x^2+A_y^2+A_z^2},\qquad \mathbf a_A=\dfrac{\mathbf A}{|\mathbf A|}` },
      { title: "Dot product", latex: String.raw`\mathbf A\cdot\mathbf B=A_xB_x+A_yB_y+A_zB_z=|\mathbf A||\mathbf B|\cos\theta_{AB}` },
      { title: "Cross product", latex: String.raw`\mathbf A\times\mathbf B=\begin{vmatrix}\mathbf a_x&\mathbf a_y&\mathbf a_z\\A_x&A_y&A_z\\B_x&B_y&B_z\end{vmatrix}` },
      { title: "Distance vector", latex: String.raw`\mathbf R_{12}=\mathbf r_2-\mathbf r_1,\qquad \mathbf a_{R12}=\dfrac{\mathbf R_{12}}{|\mathbf R_{12}|}`, note: "Always from the source point to the field point." },
    ],
  },
];
