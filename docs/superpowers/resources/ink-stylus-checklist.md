# Forma Ink: manual stylus checklist

Run on real hardware before Ink is called done on that device. Headless checks can't hold a pen, so these are by hand. Tick each box, and note the device, browser and anything odd.

| Check | iPad + Apple Pencil (Safari) | Windows pen (Edge/Chrome) | Android + S Pen (Chrome) |
|---|---|---|---|
| Palm on glass while writing: no stray ink, page doesn't move | ☐ | ☐ | ☐ |
| Pressure taper: light strokes thin, firm strokes thick | ☐ | ☐ | ☐ |
| Ink keeps up with the pen tip (no visible lag at normal writing speed) | ☐ | ☐ | ☐ |
| Barrel button / eraser end erases whole strokes | n/a (double-tap not wired) | ☐ | ☐ |
| Two-finger tap undoes; three-finger tap redoes | ☐ | ☐ (touch screen) | ☐ |
| Pinch zooms around the fingers; two-finger drag pans | ☐ | ☐ (touch screen) | ☐ |
| Shape tool: rough circle, rectangle, triangle and arrow snap | ☐ | ☐ | ☐ |
| Ruler: drag to move, drag an end to rotate, pen snaps to its edge | ☐ | ☐ | ☐ |
| Lasso → move, scale, rotate; one undo per gesture | ☐ | ☐ | ☐ |
| Text and equation: tap to place, the on-screen keyboard appears | ☐ | ☐ | ☐ |
| Convert one handwritten equation (first time: consent and download) | ☐ | ☐ | ☐ |
| Export a page as PDF and open it; Share sheet appears where supported | ☐ | ☐ | ☐ |
| Reload straight after writing: the last stroke is still there | ☐ | ☐ | ☐ |
| Blueprint theme: every ink colour readable | ☐ | ☐ | ☐ |

**Known limits in Ink 1:**
- Safari may refuse to read back text and equation images into a canvas. If so, PNG thumbnails and exports leave those items out (strokes and shapes still export). Check this on the iPad.
- The handwriting model is about 146 MB and runs on the device. On a phone, watch memory: in one headless run the page crashed about 40 s after a conversion.
- The Apple Pencil double-tap and the hover preview aren't wired up.
