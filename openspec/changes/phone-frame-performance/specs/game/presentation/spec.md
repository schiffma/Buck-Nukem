# Spec Delta

## ADDED Requirements

### Requirement: Film filter on the GPU
Where the browser supports WebGL, the film filter's colour-print grade, grain and vignette SHALL run on the GPU, without reading the frame back to the CPU. Otherwise, or when the GPU context is lost, the game SHALL use the CPU filter and keep running. Both paths SHALL produce the same look: same grade, grain, flicker, vignette, scratches, dust and jitter.

#### Scenario: GPU path when available
- **WHEN** the game starts in a browser with WebGL and the film filter is on
- **THEN** the grade runs on the GPU and no pixel readback of the frame happens during a normal drawn frame

#### Scenario: Fallback without WebGL
- **WHEN** the game starts in a browser where WebGL is not available or the shader cannot be built
- **THEN** the CPU filter is used, the film filter looks as before, and G and the Film button still toggle it

#### Scenario: Context lost
- **WHEN** the GPU context is lost while playing (for example after switching apps on a phone)
- **THEN** the game switches to the CPU filter without an error and keeps drawing frames

#### Scenario: Same look on both paths
- **WHEN** the same frame is filtered by both paths with the same flicker level and the same grain frame and offset, without scratches, dust and jitter
- **THEN** every colour channel of every pixel differs by at most 2 levels between the two outputs, and the film tests (warm grade, colour kept, vignette, animated grain, scratches, jitter, brightness and colour of the benchmark scenes) pass on both paths

#### Scenario: Cheaper per frame
- **WHEN** the phone performance check updates and draws level 1 for 300 frames with the filter on, once on the GPU path and once on the CPU path, in the same browser with hardware graphics
- **THEN** the average CPU time per frame on the GPU path is at most 60% of the CPU path's

#### Scenario: Phone budget
- **WHEN** level 1 is played in phone emulation (987×444 CSS pixels, device pixel ratio 2.75, CPU slowed 4×) with the filter on, using the phone performance check
- **THEN** the average CPU time per drawn frame (update, drawing, film filter and scaling to the screen) is under 5 ms
