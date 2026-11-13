# Third-party patches

`page-flip@2.0.7.patch` contains original and modified StPageFlip code, including
generated bundle context. Upstream: https://github.com/Nodlik/StPageFlip, version 2.0.7.

Copyright (c) 2020 Nodlik. Licensed under the MIT License. The complete original
copyright and permission notice accompanies this patch in
[StPageFlip-LICENSE.txt](../third-party/licenses/StPageFlip-LICENSE.txt).
Preserve that text when redistributing the patch or the patched library.

Project modifications cancel outstanding animation frames and initialization/touch
timers and release page references on destruction. The patch affects source files
and the browser/module bundles. Original code retains its upstream attribution;
the project's MIT copyright notice does not replace it.
