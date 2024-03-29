---
title: Blender
weight: 83

date: 2020-11-07T15:08:47-06:00
updated: 2020-11-27T15:05:05-06:00

taxonomies:
  tags:
  - art
---

Open source best in class 3D Art and modelling program.

<!-- more -->

## Low Poly Color Palette

* Grab a palette from https://lospec.com/palette-list
* Make an image with a square area in pixels that just barely covers the number
  of colors in the palette. If the palette is 16 colors, make a 4x4 pixel
  image. Color each pixel with a different color from the palette and export it
  as a png. It's easier to work with these images if they're more square, leaning
  towards a vertical orientation if the count of palettes, leaving extra spots
  as transparent.
* In blender open a new scene and go to the shading tab
* In the node tree, Shift+A to open the add menu, navigate to Texture -> Image Texture.
* In the new Image Texture node open the palette png file, and set the
  Interpolation to Closest (default is Linear)
* Connect the color node to the base color of the Principled BSDF shader
* Switch to the UV Editing tab
* In the very top right of the 3D viewport there are four viewport shading
  options (wire edges, solid, material preview, render preview) and a dropdown
  tab. In that dropdown tab under Color change to Texture.
* with the 3D viewport choose face select in the top left, then press the 'a'
  key to select all of the faces.
* Click in the UV editor pane and press 'a' to select all the vertices of the
  unwrapped box and scale the size of the unwrap to 0 by pressing 's', '0',
  'Enter'. Move the resulting point to the base color your model is going to be
  by press 'g' to grab and move it to the default color in the texture.
* To change the color of an individual face, select the face(s) mouse over the
  UV area, press 'a' to select the point, and 'g' to move it to the new color.
  When you deselect the face you'll see the new color. Worth noting that you
  want to pay attention to where the dot is, not where the cursor is.

This may need some tweaks to properly handle exporting to game engines for
lighting purposes. In Unity it looks like this can be handled automatically
with a Generate Lightmap UVs option, alternatively I saw a quick mention of
adding a second UVMap in Object Data properties of the model but I don't know
how that works yet. I'll have to come back to it later.

If I ever want to reset the color of the entire object again, I'll need to
select all the faces, then select all the UV points, scale them to zero again
(and confirm it with enter), then grab them and move the point to a specific
color.

## Shiny Viewport Settings

* In the top right corner of the 3D viewport, next to the viewport shading
  options, there is a drop down.
* In that drop down turn on Backface Culling, Shadows, and Cavity (with type
  'Both')
* Set the revealed Ridge and Valley options for both world and screen space to
  their maximums of 2.5 and 2.0

If I want to have the same look in a rendered output I need to open up the
Rendering tab and in the Render Properties tab on the right I need to change
the Render Engine to Workbench, set the Color to Texture, and apply the same
shadow and cavity as before.

Note: The backface culling option is to let you know when an object's face is
oriented the wrong direction. This can prevent issues when importing the model
into a game engine. If a face is facing the wrong direction, you can select it
hit f3, search for flip normals and apply it.

## Random Tips

### Movement Gizmo

Shift + Space + G will turn on the movement gizmo, allowing for quick handle to
grab and move things along different axis if I don't want to manually select
them. This can be made the default on selecting something by clicking the
viewport gizmos dropdown in the top right of the main 3D window and enabling
the Move gizmo.

With an individual vertex selected, it can be moved along an existing edge by
pressing g twice.

### Invidividual Face Scaling

If the scaling behavior of multiple objects is adjusting too much of the mesh,
might want to try switching to scaling individual origins. This can be done by
selecting the meshes to scale, press '.' in the main viewport and choosing
'Individual Origins'. When scaling with 's' again the faces themselves will be
scaled without impacting measurements relative to the face. The default is
Median Point.

### Multi-Direction Face Extrusions

With multiple faces selected I can press Alt + E and choose Extrude Along Face
Normals to have the multiple faces all extrude individually instead of a weird
shifting that would be the default.

This will keep adjacent edges touching so can quickly make something like the
center of a box 'fatter' without scaling.

If I want to extrude the faces but break the adjacency of edges I can use
Extrude Individual Faces instead.

### Mirror Modifier Inset

By default with the mirror modifier on, insets will be relative to half the
overall model. To get the faces to 'connect' across the mirror'd boundary.
After selecting the face and pressing I to begin the inset process, you can
press B to turn the boundary off to keep them connected. If it doesn't work try
pressing I to turn the individual setting off.

### 3D Cursor to Selected

The 3D cursor is used as the initial origin of any newly created objects. To
make the origin the center of the face, select the face, press Shift + S, and
choose Cursor to Selected.

To return the 3D cursor the editor origin I can press Shift + C

### Selecting Sub-Geometry

If I'm editing an object with multiple base meshes in and I was to select all
of one mesh, I can click on the mesh I'm interested in and press 'l' to select
all linked vertices, edges, or faces.

I can select additional mesh objects by mousing over them and pressing l again,
or removing them by pressing Shift + l.

### Connected Proportional Editing

If I'm working within an object with multiple meshes and I want to use
proportional editing (press 'o' to turn on or use the orbit looking tool at the
middle top of the 3d viewport in edit mode). If I want the proportional changes
to only apply to one mesh I can select that dropdown in the middle top and turn
on 'Connected Only'.

You may be able to go directly into that mode with Alt + O

### Box Select

To select all things in a box like selector press b. This will only select the
front objects unless X-ray mode is turned on using Alt + Z or the toggle in the
top right of the 3D viewport.

### Lasso Select

Like the box select but with a free drawn selector. Hold down Ctrl and right
mouse button while drawing the shape to select.

### Grow / Shrink Selection Area

If I want to expand my selection by one face I can press Ctrl + NumPad '+',
likewise with shrinking using Ctrl + NumPad '-'. Useful for selecting all
neighboring faces consistently and quickly.

### Hiding Submeshes

When working on an object with multiple submeshes it can be useful to
temporarily hide some of them. For this I can hover over it and press 'l' to
select the mesh, then press 'h' to hide them.

The geometry can be returned by pressing Alt + 'h' to show everything that has
been hidden.

### Reducing the Polygons of An Object

The Decimate object modifier can be used to reduce the final geometry of an
object by a best approiximation method. Subdividing, doing some relatively
detailed modeling, then decimating it can lead to some neat accidental effects.

### Removing Extra Geometry

One way would be to turn on "auto-merge vertices" an option in the right of the
title bar of the main 3D viewport, turning on vertex snapping and moving (with
ctrl down) the offending vertices.

If the vertices, faces, or edges have already overlapped exactly. I can press
the 'M' to bring up the Merge meny and select 'By Distance'. This is good to do
periodically for more complex tasks.

### Inverting Face Directions

This can be useful if making a cave. You can create the object that represents
the shape of the overall cave structure, but the back faces will be on the
inside where you want the camera to be able to see the surfaces. Select all the
faces press Alt + 'N' and choose Recalculate Inside. Recalculate Outside is
available to which is more useful at fixing weird holes in meshes.

### Mirror Modifier

To quickly get started create the default cube, do a loop cut along one axis
and delete half the cube (cut along y for the defaults to apply). Go into
object mode, add a Mirror Modifier and turn clipping on.

### Low Poly Geometry Flattening

I'm not sure what this should actually be called but I was trying to figure out
how it was done and finally saw it go by in a 20x speed video. There was a
single object with many overlapping rectangular prisms of varying sizes,
primarily vertically stretched. To get the 'flat' look associated with that
kind of 3D low poly game the artist used 'Remesh' tab (same tab that has Vertex
Groups).

In there applied a Voxel remesh with a voxel size of 0.072m (they had to play
with this a bit) to get the corners sort of blended together. Then applied a
Decimate modifier to the mesh in 'Collapse' mode with a radio of 0.0287 which
gave that flat look I was looking for.

After manually cleaning up some of the mesh, reflattening some of the surfaces,
The normals were auto smoothed to about 35 degrees which helped clean it up
even more.

## Rigging Notes

### Useful Blender Extensions

* Mesh: Auto Mirror
* Rigging: Riggify

### Tips

* It seems like it is better to have different object components for different
  movable pieces for mechanical objects. For organic deformation a single mesh
  is fine. Each object will get its own Vertex Group automatically.
* Objects probably shouldn't be parented to each other, but can be in the same
  collection for organizational reasons.
* Armature deforms are an object modifier, if there are other modifiers they
  generally should be below the armature object (I suspect subdivide is
  probably one of the exceptions for organic objects).
* Before Rigging, make sure all transforms are applied to the various objects
  in the model so everything is zero'd out (press a to select everything then
  Ctrl + A, Apply All Transforms)
* While rigging it can be super useful to ensure the rig is always rendered in
  front of the model. This can be done by select the Armature object, going to
  the "Object Data Properties" parameter page, expanding Viewport Display and
  checking 'In Front'
* The 'head' of the bone is at the base (the fat end), the 'tail' of the bone is
  at the top (the skinny pointed end).
* Rotation in pose mode happens around the 'head' point
* Subdividing works with bones to split them equally and evenly
* Using a suffix of 'L' can allow blender to magically symetrize models that
  mirror about a single axis (ex: 'Hand.L.001'). Select the relevant bones that
  have been named with this convention, right click and choose 'Symmeterize'.
* Making future changes to symetrized bones can be duplicated by expanding the
  tool options, and click X-Axis Mirror (might be a different). Changes such as
  parenting should be replicated.
* Usually when I want to parent a bone I'm going to want to do the
  'Keep Transform' option. The other option 'Connected' will move the head of
  the child bone to the parent's tail.
* Precision placement of the joint ends can be done using the 3D cursor, select
  a target object, press Shift + S then 'Cursor to Selected' (this may need to
  be done in Edit Mode), select the bone's head or tail (whatever you're trying
  to move) and press Shift + S then use Selected to Cursor.
* Once the rig is created, if it's an organic object that is elastic and can be
  deformed a bit more freely automatic weights can be used. This is the fastest
  way to setup a rig but doesn't work well for mechanical constructions. Select
  all the mesh objects that apply to the rig, then select your Rig (it's
  important to select it last). Then press Ctrl + P, and select 'Armature Deform
  With Automatic Weights'. For mechanical constructions you instead want to set
  the weights by hand so choose 'Armature Deform With Empty Groups'. To assign
  weights to the individual components, click on the relevant object in Object
  mode and open the 'Object Data Properties' attribute panel. Switch to edit
  mode and choose the vertex group with a name matching the bone that will be
  controlling that object and set its weight to 1.0 and click on 'Assign'.
* In pose mode I can prevent certain bones from having different types of
  rotations and transforms by locking them in the transform window. This is very
  useful when building an IK model. Some bones are meant for rotation only, some
  translation only, and rarely scaling will be useful.
* After vertex weights have been applied, you can duplicate parts of the bones
  to be used as control nodes or as a separate IK model (for example for mixing
  it with a FK model).
* IK controls are normal bones that have no weight associated with a vertex group
* To add a constraint between bones, enter pose mode, select the two bones,
  press Ctrl + Shift + C. The one that was first shown and probably one of the
  most useful ones is the 'Inverse Kinematics'. The length of the IK chain
  handling can be set in the 'Context/Bone Constraints' attributes panel you
  can increase the chain length.
* To control the direction of something like an elbow's position around an arm,
  we want to set a pull vector. Extrude a bone from the elbow, press Ctrl + P
  and clear the parent. Move it a little ways away along an axis perpendicular
  to the elbow. Parent it to the root bone of the armiture. Add a bone
  constraint, associate the pole target with the armature, and the bone with
  whatever you named that extruded control bone.  You may need to adjust the
  pole angle to get it facing the correct direction.
* To cause a duplicate set of bones to behave like another one, individual bones
  can be selected, press Ctrl + Shift + C and choose Copy Transforms. You'll
  want to do this between each pair of bones.
* To blend between an IK model and an FK model, make sure there is two copies
  of the relevant bones, an IK model setup on one of them, and copy transforms
  between the two copies of each bone and the root. Reset the 3D cursor with
  Shift + C, add a new bone, and move it to the side (this will be the blend
  controller between IK & FK). Parent it to the root node. Add a bone
  constraint of the Limit Location, enable all the min and max limitations,
  leaving the Ys and Zs at zero, Set Min X to 0m, and Max X to 1m, set Convert
  to 'Local Space', and enable 'For Transform'. This will restrict its behavior
  to being posed like a switch. On one of the bone constraints between the
  primary armiture, and the FK armiture, right click on the influence slider,
  go to Add Driver, change the expression to 'blend_amt', in the variable,
  adjust its name to 'blend_amt' choose the rig as the object, and the freshly
  created control node as the bone, with X location in Local Space. This driver
  can be copied and pasted on each of the copy transform constraints between
  the IK model and the base model. It should work at this point, if not make
  sure that the IK bone constraints appears after the FK bone constraints.
* If I want to move copies of a model back onto the OG version to move it
  correctly in edit mode, I'll want to select all the bones with the bone
  closest to a root bone selected last, change the 'Pivot Point' (one of the
  options along the to bar) to 'Active Element' and move it into place.
* Different sets of bones can be placed on different layers to make it easier to
  select the appropriate ones. Very useful to grab only the FK layer when
  initially posing and all the models are overlapping. To set bones on a layer
  select them and go to the armiture object data, press m on the keyboard and
  click to position it on a separate layer (can I shift click to keep it on two
  layers?). It would be nice to have layers for 'all', 'fk', 'ik', and 'root'.
  I may not be able to have the 'all' layer... In the armiture properties view
  multiple layers can be shown by shift clicking them.
* If I'm gettig weird roll behavior on a lower part of an arm, I may need to
  reorient it relative to one of the parent arm rolls. Select all the bone on
  the lower segment of the arm, and one of the parents they should be rotating
  relative too (as the last bone), press Shift + N and choose 'Other' ->
  'Active Bone'.
* Custom shapes can be setup on bones to more accurately represent their intended
  use (such as root movement, or an FK/IK control). Create the desired object
  shape, go to the bone attribute panel, under Viewport Display select the
  reference object of the shape you want to use. If the orientation is wrong
  relative to the shape, object mode rotations can be used to match how it
  appears, and edit mode rotations can apply them to the display. Turning on the
  axis in the viewport display can assist with this orientation. If the controls
  are too large, the scale option in the bone viewport display can adjust the
  size of the control. I might need to be in pose mode to set the custom
  control object.

### Blender Special Bone Prefixes

Apparently some prefixes have special annotations in blender, I haven't
confirmed any of this.

* CTRL: ???
* MCH: A bone that is strictly controlled by other bones. When making an
  animation these won't be keyframed automatically.
