# ZERO / XG Robotic Arm Model Source

This directory contains a derived, web-optimized conversion of the open-source **零一造物 / XG ZERO robotic arm** model.

- Upstream: <https://gitee.com/dearxie/zero-robotic-arm>
- Source revision: `99acada813b943d120e756c9bdfea0e95a5b5327`
- License: GNU General Public License v2 (see `LICENSE`)
- Converted: 2026-08-11

## Derivation

`zero-robotic-arm.glb` was converted from the seven binary STL visual meshes in `3. Simulink/URDF_XG_Robot_Arm_Urdf_V1_1/meshes/`. The link and joint hierarchy, origins, rotations, and local Z joint axes come from `URDF_XG_Robot_Arm_Urdf_V1_1.urdf` at the revision above.

The conversion welds coincident vertices, preserves independent named links and joints, and applies meshoptimizer simplification at a 0.25 target ratio with a 0.5% error ceiling. No textures or source-authored materials were discarded; the URDF specifies one neutral color and the portfolio assigns presentation materials at runtime. The resulting asset contains 93,645 triangles across seven meshes (down from 371,786) and remains in the source URDF's right-handed, Z-up coordinate system.

This GLB is a modified/derived form, not an upstream release. Obtain the complete corresponding source from the upstream URL at the pinned revision above.
