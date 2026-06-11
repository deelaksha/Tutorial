"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";

const NAV = [
  { id: "pull", label: "docker pull — Get Images" },
  { id: "tags", label: "Tags — Naming Versions ⭐" },
  { id: "layers", label: "Images Are Layers ⭐" },
  { id: "history", label: "X-Ray an Image: history" },
  { id: "sharing", label: "Layer Sharing & Cache" },
  { id: "writable", label: "The Container's Writable Layer" },
  { id: "inspect", label: "inspect — Full Metadata" },
  { id: "manage", label: "List, Delete, Prune" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DockerImagesPage() {
  return (
    <TopicShell
      icon="📦"
      title="Images & Layers"
      gradientWord="Layers"
      subtitle="An image is not one big blob — it's a stack of read-only layers, shared and cached. Understand the stack and you understand why pulls are fast, why builds cache, and where your disk space goes."
      nav={NAV}
      next={{ icon: "🚢", label: "Container Lifecycle", href: "/docker/containers" }}
    >
      {/* 01 ─ PULL */}
      <Section id="pull" number="01" title="docker pull — Get Images From the Registry">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker pull python:3.12-slim`}
          output={`3.12-slim: Pulling from library/python
a480a496ba95: Pull complete      ← layer 1  (Debian base)
f3aceb2bbcb2: Pull complete      ← layer 2  (OS updates)
c41d883958b4: Pull complete      ← layer 3  (python runtime)
28a7e7e74746: Pull complete      ← layer 4  (pip, setuptools)
Digest: sha256:1b30f1e2a...
Status: Downloaded newer image for python:3.12-slim

← FOUR separate downloads, not one. each line = one LAYER.
   this page is about why that matters.`}
        />
        <Callout type="note">
          <IC>library/python</IC> means an <strong>official image</strong> — curated by Docker.
          Community images look like <IC>username/imagename</IC>. Prefer official ones; they&apos;re
          patched, documented, and downloaded billions of times.
        </Callout>
      </Section>

      {/* 02 ─ TAGS */}
      <Section id="tags" number="02" title="Tags — Naming Image Versions ⭐">
        <P>
          The part after the <IC>:</IC> is the <strong>tag</strong> — a human label for one version
          of an image. One image can wear many tags:
        </P>
        <CodeBlock
          title="image_naming.txt"
          runnable={false}
          code={`         registry.example.com / myteam / myapp : 2.1
         ──────────┬──────────   ──┬───   ──┬──   ─┬─
           registry host          owner    name    tag
           (omitted = Docker Hub)                  (omitted = latest)

common python tags — same software, different trade-offs:
  python:3.12          full Debian + python    ~1.0 GB   everything works
  python:3.12-slim     minimal Debian + python ~120 MB   ⭐ usual best pick
  python:3.12-alpine   Alpine Linux + python   ~50 MB    tiny but quirky builds`}
        />
        <Callout type="mistake">
          <IC>latest</IC> does <strong>NOT</strong> mean &quot;newest&quot; — it&apos;s just the
          default tag name, pointing wherever the publisher last left it. Pulling{" "}
          <IC>python</IC> today and next month can give different versions silently. In anything
          serious, <strong>always pin a tag</strong>: <IC>python:3.12-slim</IC>, never bare{" "}
          <IC>python</IC>.
        </Callout>
        <Callout type="analogy">
          🏷️ Tags are like git branch names — movable stickers pointing at a version.
          The <IC>Digest: sha256:...</IC> from the pull output is like a commit hash: the
          immutable, exact identity.
        </Callout>
      </Section>

      {/* 03 ─ LAYERS */}
      <Section id="layers" number="03" title="Images Are STACKS of Read-Only Layers ⭐">
        <P>
          The #1 mental model of this page: an image is not a blob, it&apos;s a{" "}
          <strong>stack of read-only layers</strong>, each one recording &quot;what changed on top
          of the layer below&quot;:
        </P>
        <CodeBlock
          title="layer_stack.txt"
          runnable={false}
          code={`            python:3.12-slim — what it really is:

            ┌──────────────────────────────────┐
   layer 4  │ + pip, setuptools                │  each layer = a diff
            ├──────────────────────────────────┤  on top of the one
   layer 3  │ + python 3.12 binaries           │  below it
            ├──────────────────────────────────┤
   layer 2  │ + OS security updates            │  ALL of them
            ├──────────────────────────────────┤  read-only, forever
   layer 1  │ debian 12 base filesystem        │
            └──────────────────────────────────┘

  reading a file = look down through the stack, top wins.
  the running container sees ONE merged filesystem
  (the kernel's overlay filesystem glues the stack together).`}
        />
        <Callout type="behind">
          On Linux this is the <IC>overlay2</IC> storage driver you saw in{" "}
          <IC>docker info</IC>. Layers live in <IC>/var/lib/docker/overlay2/</IC> — each is just a
          directory of files, merged at runtime into one view.
        </Callout>
      </Section>

      {/* 04 ─ HISTORY */}
      <Section id="history" number="04" title="X-Ray Any Image: docker history">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker history python:3.12-slim`}
          output={`IMAGE          CREATED BY                                SIZE
27f1e2a8b...   CMD ["python3"]                           0B     ← metadata only
<missing>      RUN pip install setuptools                12MB
<missing>      RUN apt-get install python3.12            48MB
<missing>      RUN apt-get update && upgrade             18MB
<missing>      ADD debian-base.tar /                     75MB   ← the base

← read bottom-up: the image's whole construction story,
   one layer per line, with each layer's size.
   THIS is also how you find what's bloating your image.`}
        />
        <Callout type="tip">
          Every layer was created by one instruction in a <strong>Dockerfile</strong> (next-next
          page). <IC>history</IC> is literally someone else&apos;s Dockerfile, read back from the
          image.
        </Callout>
      </Section>

      {/* 05 ─ SHARING */}
      <Section id="sharing" number="05" title="Layer Sharing — Why Pulls Are Fast & Disk Stays Small">
        <P>
          Layers are content-addressed (named by hash of their content) — so identical layers are
          stored <strong>once</strong> and shared by every image that uses them:
        </P>
        <CodeBlock
          title="layer_sharing.txt"
          runnable={false}
          code={`you have python:3.12-slim. now you pull python:3.12-slim-bookworm:

   python:3.12-slim          python:3.12-slim-bookworm
   ┌────────────────┐        ┌────────────────┐
   │ pip layer      │        │ pip layer      │
   │ python layer   │        │ python layer   │      these 4 layers?
   │ updates layer  │        │ updates layer  │      SAME HASHES.
   │ debian base    │        │ debian base    │
   └───────┬────────┘        └───────┬────────┘
           └──────────┬──────────────┘
                      ▼
            stored ON DISK exactly ONCE

$ docker pull python:3.12-slim-bookworm
a480a496ba95: Already exists     ← ⭐ not downloaded again!
f3aceb2bbcb2: Already exists
c41d883958b4: Already exists
28a7e7e74746: Already exists`}
        />
        <Callout type="tip">
          ⭐ This is the same trick git uses for unchanged files (content-addressing → automatic
          deduplication). It&apos;s why 50 images on your laptop don&apos;t take 50 × 1GB, and why
          a second pull of a similar image takes seconds.
        </Callout>
      </Section>

      {/* 06 ─ WRITABLE LAYER */}
      <Section id="writable" number="06" title="The Container's Writable Layer — Where Your Changes Go">
        <P>
          If all image layers are read-only... how did <IC>touch /i_was_here</IC> work last page?
          When a container starts, Docker adds <strong>one thin writable layer on top</strong>:
        </P>
        <CodeBlock
          title="writable_layer.txt"
          runnable={false}
          code={`        container A              container B        ← same image,
   ┌───────────────────┐    ┌───────────────────┐     two containers
   │ ✏️ writable layer  │    │ ✏️ writable layer  │
   │   /i_was_here     │    │   (empty)         │   ← each gets its OWN
   ╞═══════════════════╡    ╞═══════════════════╡     scratchpad
   │                   │    │                   │
   │   image layers    │◀──▶│   image layers    │   ← READ-ONLY,
   │   (read-only,     │    │   (shared!)       │     shared by both
   │    shared)        │    │                   │
   └───────────────────┘    └───────────────────┘

 • write a file        → lands in the writable layer
 • "modify" an image file → copied up first, then edited (copy-on-write)
 • delete the container → writable layer deleted with it  💨
   (this is EXACTLY why container data is ephemeral)`}
        />
        <Callout type="analogy">
          📄 The image is a <strong>printed worksheet</strong>; the writable layer is a{" "}
          <strong>transparent sheet laid over it</strong>. Everyone writes on their own
          transparency — the worksheet underneath stays pristine, and tossing your transparency
          loses your notes, never the original.
        </Callout>
      </Section>

      {/* 07 ─ INSPECT */}
      <Section id="inspect" number="07" title="docker inspect — Full Metadata as JSON">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker inspect python:3.12-slim          # EVERYTHING (huge JSON)
$ docker inspect --format '{{.Config.Cmd}}' python:3.12-slim   # one field`}
          output={`$ docker inspect --format '{{.Config.Cmd}}' python:3.12-slim
[python3]
     ← the default command this image runs (why "docker run -it python:3.12-slim"
        drops you straight into a Python REPL)

other goldmine fields:
  .Config.Env            default environment variables
  .Config.ExposedPorts   ports the image expects to use
  .RootFS.Layers         the exact layer hashes of the stack`}
        />
        <Callout type="note">
          <IC>inspect</IC> works on containers, networks and volumes too — it&apos;s Docker&apos;s
          universal &quot;show me everything about this object&quot; command.
        </Callout>
      </Section>

      {/* 08 ─ MANAGE */}
      <Section id="manage" number="08" title="List, Delete, Prune — Managing Disk Space">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker images                 # what's on disk + sizes
$ docker rmi python:3.12-slim   # delete one image
$ docker image prune            # delete dangling images (untagged leftovers)
$ docker system df              # the full disk-usage report`}
          output={`$ docker images
REPOSITORY   TAG          IMAGE ID       CREATED       SIZE
python       3.12-slim    27f1e2a8b3c4   2 weeks ago   124MB
nginx        latest       a72860cb95fd   3 weeks ago   188MB

$ docker rmi python:3.12-slim
Error response from daemon: conflict: unable to delete...
container 8a2f... is using its referenced image          ← 💥 see below

$ docker system df
TYPE            TOTAL   ACTIVE   SIZE      RECLAIMABLE
Images          12      3        2.1GB     1.4GB (66%)
Containers      5       1        48MB      45MB
Local Volumes   4       2        890MB     220MB`}
        />
        <Table
          head={["Command", "Deletes", "Safe?"]}
          rows={[
            [<IC key="1">docker rmi IMG</IC>, "one image (refuses if a container uses it)", "yes — it checks first"],
            [<IC key="2">docker image prune</IC>, "dangling images only (untagged build leftovers)", "yes"],
            [<IC key="3">docker image prune -a</IC>, "ALL images not used by any container", "re-pulling may take a while"],
            [<IC key="4">docker system prune</IC>, "stopped containers + unused networks + dangling images", "read its prompt!"],
          ]}
        />
        <Callout type="mistake">
          The <IC>rmi</IC> error above is the image/container distinction biting back: you must{" "}
          <IC>docker rm</IC> the containers using an image (even <em>stopped</em> ones) before the
          image can go. Order: containers first, images second.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Image =", "a STACK of read-only layers + metadata (not one blob)"],
            ["Layer =", "one diff on top of the layer below, content-addressed by hash"],
            ["Tag", "human label for a version — image:tag, default is :latest"],
            [":latest", "just a default tag name, NOT 'newest' — always pin versions"],
            ["Layer sharing", "same hash = stored once, shared by all images ('Already exists')"],
            ["Writable layer", "thin scratchpad added per container — dies with the container"],
            ["Copy-on-write", "'editing' an image file copies it UP to the writable layer first"],
            ["docker history IMG", "the layer-by-layer construction story (+ sizes)"],
            ["docker inspect IMG", "full JSON metadata — Cmd, Env, ExposedPorts, Layers"],
            ["Cleanup order", "docker rm containers FIRST, then docker rmi the image"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
