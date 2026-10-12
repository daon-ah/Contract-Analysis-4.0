import re
from dataclasses import dataclass

# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

MIN_CLAUSE_LENGTH = 30

MAX_CLAUSE_LENGTH = 4000

HEADER_PATTERNS = [

    re.compile(
        r"^\s*(ARTICLE|SECTION|CLAUSE)\s+[\dIVXLC]+[.\-:]?\s*.*$",
        re.IGNORECASE,
    ),

    re.compile(
        r"^\s*\d+(\.\d+)*\.?\s+[A-Z][A-Za-z ,]{3,80}$"
    ),

    re.compile(
        r"^\s*[A-Z][A-Z ]{4,80}$"
    ),
    re.compile(
        r"^\s*[A-Z][A-Za-z/&(),\- ]{3,80}$"
),
]

SENTENCE_SPLIT_PATTERN = re.compile(
    r"(?<=[.;])\s+(?=[A-Z(\"'])"
)

# ---------------------------------------------------------------------
# Data Model
# ---------------------------------------------------------------------

@dataclass
class Segment:
    """
    Represents a segmented legal clause.
    """

    index: int

    header: str | None

    text: str


# ---------------------------------------------------------------------
# Header Detection
# ---------------------------------------------------------------------

def _is_header(line: str) -> bool:
    line = line.strip()

    if not line:
        return False

    # Ignore page numbers
    if re.search(r"Page\s+\d+\s+of\s+\d+", line, re.IGNORECASE):
        return False

    # Ignore document titles
    if "NON-DISCLOSURE AGREEMENT" in line.upper():
        return False

    return any(
        pattern.match(line)
        for pattern in HEADER_PATTERNS
    )


# ---------------------------------------------------------------------
# Split by Headers
# ---------------------------------------------------------------------

def _split_by_headers(
    full_text: str,
) -> list[tuple[str | None, str]]:
    """
    Split a document into blocks using detected headers.
    """

    lines = full_text.split("\n")

    blocks = []

    current_header = "General"

    current_lines = []

    for line in lines:

        if _is_header(line):

            if current_lines:

                blocks.append(
    (
        current_header or "General",
        "\n".join(current_lines).strip(),
    )
)

            current_header = line.strip()

            current_lines = []

        else:

            current_lines.append(line)

    if current_lines:

        blocks.append(

            (
                current_header,
                "\n".join(current_lines).strip(),
            )

        )

    return [

        block

        for block in blocks

        if block[1]

    ]


# ---------------------------------------------------------------------
# Oversized Block Splitting
# ---------------------------------------------------------------------

def _split_oversized_block(
    text: str,
) -> list[str]:
    """
    Split extremely long clauses into smaller chunks.
    """

    if len(text) <= MAX_CLAUSE_LENGTH:

        return [text]

    sentences = SENTENCE_SPLIT_PATTERN.split(text)

    chunks = []

    current = ""

    for sentence in sentences:

        if (

            len(current)

            + len(sentence)

            + 1

            > MAX_CLAUSE_LENGTH

            and current

        ):

            chunks.append(current.strip())

            current = sentence

        else:

            current = (

                f"{current} {sentence}"

            ).strip()

    if current:

        chunks.append(current.strip())

    return chunks
# ---------------------------------------------------------------------
# Skip Metadata / Non-Legal Content
# ---------------------------------------------------------------------

def _is_metadata(
    header: str | None,
    text: str,
) -> bool:
    """
    Detect non-contract metadata that should not be analyzed.
    """

    combined = f"{header or ''}\n{text}".strip()

    if not combined:
        return True

    text_upper = combined.upper()

    if len(text.strip()) < 80:
        if any(keyword in text_upper for keyword in [
            "PAGE",
            "SIGNED",
            "ATTN",
            "ATTENTION",
            "PHONE",
            "EMAIL",
            "FAX",
        ]):
            return True

    # Windows network/file paths
    if re.search(r"(\\\\|[A-Za-z]:\\)", combined):
        return True

    # Document filenames
    if re.search(
        r"\.(doc|docx|pdf|txt)$",
        combined,
        re.IGNORECASE,
    ):
        return True

    # Email
    if re.search(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        combined,
    ):
        return True

    # Mostly underscores (signature lines)
    if re.fullmatch(r"[_\-\s]{5,}", combined):
        return True

    # Mostly punctuation
    if re.fullmatch(r"[-_=*. ]{5,}", combined):
        return True

    return False

# ---------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------

def segment_document(
    full_text: str,
) -> list[Segment]:
    """
    Segment a legal document into meaningful clauses.
    """

    if not full_text.strip():
        return []

    normalized = re.sub(
        r"\r\n?",
        "\n",
        full_text,
    )

    normalized = re.sub(
        r"\n{3,}",
        "\n\n",
        normalized,
    )

    blocks = _split_by_headers(normalized)

    if not blocks:

        blocks = [
            (
                "General",
                normalized.strip(),
            )
        ]

    segments = []

    index = 0

    for header, text in blocks:

        text = text.strip()

        # Skip metadata sections
        if _is_metadata(header, text):
            continue

        if len(text) < MIN_CLAUSE_LENGTH:
            continue

        chunks = _split_oversized_block(text)

        for chunk in chunks:

            chunk = chunk.strip()

            if not chunk:
                continue

            # Skip metadata chunks
            if _is_metadata(header, chunk):
                continue

            if len(chunk) < MIN_CLAUSE_LENGTH:
                continue

            segments.append(

                Segment(

                    index=index,

                    header=header or "General",

                    text=chunk,

                )

            )

            index += 1

    return segments


# ---------------------------------------------------------------------
# Example
# ---------------------------------------------------------------------

if __name__ == "__main__":

    sample = """
    ARTICLE I

    Definitions

    The following definitions apply to this Agreement.

    ARTICLE II

    Payment

    The customer shall pay all invoices within
    thirty days.

    ARTICLE III

    Liability

    The supplier shall indemnify and hold harmless
    the customer against all losses and damages.
    """

    segments = segment_document(sample)

    print()

    print("Segments Found:", len(segments))

    print("-" * 50)

    for segment in segments:

        print(f"Segment {segment.index}")

        print("Header :", segment.header)

        print("Text   :", segment.text)

        print("-" * 50)