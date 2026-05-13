# naneinf-calc
A simple website to analyze Balatro runs, and how close one is to hitting the score limit: naneinf or roughly 1.7e308.


## What is this?
This calculator fills a niche: helping players visualize just how effective their builds are, and how close it is relative to naneinf.

It is aimed to be:
- Easy to use
- Fast
- Minimal
- Very understandable

## Features
- A simple interface to organize your starting hand, including chips, mult, kings in hand, and how many of them are steel.
- You can tweak whether you are on the Plasma Deck, on The Serpent, took an ectoplasm, have both handsize vouchers, and Antimatter.
- You are able to organize your jokers to visualize how joker order matters.
- A progress bar to visualize how close you are to naneinf, the estimated score, a log10 score, how big the gap is to naneinf, and how many triggers you have.

## How to use
1. Select your starting chips and mult per your in-game level, choose whether you have red seals or are on plasma deck.
2. Choose your vouchers.
3. Choose your jokers and organize them based on your preference (NOTE: Having Burglar anywhere in the lineup will have the program add more hands dynamically, since it assumes you did the "quicktime event" to copy Burglar).
4. Watch that number grow.

## Tech Stack
- HTML
- CSS
- JavaScript

## Future Plans / Roadmap
- Refactor code to make the website easier to develop (for 0.4.0)
- Integrate a build navigation tool that replaces the webpage per build. (for 0.4.0)
- Add Perkeo Cryptid and High Card Planet Accelerator builds (for 0.5.0)
- Add Flush Five naneinf strategies (for 0.6.0)
- Reworking the joker organization tool and general UI/UX (for 1.0)
- Spanish / Portugese Localization (for 1.0)
- Save build/state (for 1.1)
- Add "you can naneinf at round (x) (for 1.2)
- 1.x and beyond will be adding niche strategies to the lineup

## Notes
Hello! I'm Nick and I hope you enjoy the project! :) I have a few notes I would like to share personally that is like a "thought-dump" more than anything else.
Basically, this project started as a mandated vibe-code in my class, but now it turned into a project I want to seriously maintain. This is my first website I have made, so hopefully over time as I get better at coding (and Balatro), this site will become more useful.

## Credits & Acknowledgments
This project is a fan-made tool and is not affiliated with Playstack or LocalThunk.

- Game Assets & Logic: All Joker designs, names, and original game mechanics are the property of LocalThunk, the creator of Balatro.
- Vagabond Joker: A note that Lumpy Touch is the artist who designed the Vagabond Joker.
- Data & Images: High-resolution Joker assets and game data were sourced from the Balatro Wiki, which is maintained by the community under a Creative Commons license.

## License
This project is licensed under the MIT License.
