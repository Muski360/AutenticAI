import 'package:flutter/material.dart';

const paper = Color(0xFFFFFFFF);
const surface = Color(0xFFF3F7F9);
const tint = Color(0xFFEAF1F5);
const ink = Color(0xFF142833);
const navy = Color(0xFF102E44);
const muted = Color(0xFF526773);
const border = Color(0xFFDCE5E9);
const blue = Color(0xFF1557B0);
const cyan = Color(0xFF2DBBEF);
const success = Color(0xFF16704A);
const danger = Color(0xFFA23535);
const warning = Color(0xFF805900);

ThemeData investigationTheme() {
  final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(6));
  final base = ThemeData(
    useMaterial3: true,
    fontFamily: 'Inter',
    colorScheme: const ColorScheme.light(
      primary: blue,
      onPrimary: paper,
      secondary: navy,
      surface: paper,
      onSurface: ink,
      outline: muted,
      outlineVariant: border,
      error: danger,
    ),
    scaffoldBackgroundColor: surface,
    dividerColor: border,
    visualDensity: VisualDensity.standard,
    appBarTheme: const AppBarTheme(
      backgroundColor: paper,
      foregroundColor: ink,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shape: Border(bottom: BorderSide(color: border)),
      titleSpacing: 14,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: navy,
        foregroundColor: paper,
        shape: shape,
        minimumSize: const Size(0, 48),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: navy,
        side: const BorderSide(color: Color(0xFFB4C6D0)),
        shape: shape,
        minimumSize: const Size(0, 48),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: blue,
        shape: shape,
        minimumSize: const Size(0, 48),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: paper,
      labelStyle: const TextStyle(color: muted),
      alignLabelWithHint: true,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(7)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(7),
        borderSide: const BorderSide(color: Color(0xFFB4C6D0)),
      ),
    ),
    dialogTheme: DialogThemeData(backgroundColor: paper, shape: shape),
  );
  return base.copyWith(
    textTheme: base.textTheme
        .apply(bodyColor: ink, displayColor: ink)
        .copyWith(
          bodyMedium: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 16,
            height: 1.5,
          ),
          titleLarge: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 26,
            fontWeight: FontWeight.w500,
            letterSpacing: -1.2,
          ),
          titleMedium: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 19,
            fontWeight: FontWeight.w600,
            letterSpacing: -.5,
          ),
        ),
  );
}

class BrandLockup extends StatelessWidget {
  const BrandLockup({super.key});

  @override
  Widget build(BuildContext context) => Image.asset(
    'assets/brand.webp',
    width: 146,
    height: 34,
    fit: BoxFit.cover,
    semanticLabel: 'AutenticAI',
    errorBuilder: (_, _, _) => const Text('AutenticAI'),
  );
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(width: 6, height: 6, color: cyan),
      const SizedBox(width: 9),
      Expanded(
        child: Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 11,
            color: muted,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.05,
          ),
        ),
      ),
    ],
  );
}

class DisplayTitle extends StatelessWidget {
  const DisplayTitle(this.lead, this.accent, {super.key});
  final String lead;
  final String accent;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.headlineLarge!.copyWith(
      fontSize: 38,
      height: 1.04,
      fontWeight: FontWeight.w500,
      letterSpacing: -2.2,
    );
    return Semantics(
      header: true,
      child: Text.rich(
        TextSpan(
          style: style,
          children: [
            TextSpan(text: '$lead\n'),
            TextSpan(
              text: accent,
              style: const TextStyle(color: blue),
            ),
          ],
        ),
      ),
    );
  }
}

class Panel extends StatelessWidget {
  const Panel({
    super.key,
    required this.child,
    this.highlight = false,
    this.color = paper,
  });
  final Widget child;
  final bool highlight;
  final Color color;

  @override
  Widget build(BuildContext context) => Material(
    color: color,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(7),
      side: BorderSide(color: highlight ? cyan : border),
    ),
    child: Padding(padding: const EdgeInsets.all(16), child: child),
  );
}

class FeedbackLine extends StatelessWidget {
  const FeedbackLine(
    this.message, {
    super.key,
    this.error = false,
    this.progress = false,
  });
  final String message;
  final bool error;
  final bool progress;

  @override
  Widget build(BuildContext context) => Semantics(
    liveRegion: true,
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: error ? const Color(0xFFFFF2F1) : const Color(0xFFEAF4FC),
        border: Border(
          left: BorderSide(color: error ? danger : blue, width: 3),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (progress && !MediaQuery.disableAnimationsOf(context))
            const Padding(
              padding: EdgeInsets.only(top: 3),
              child: SizedBox.square(
                dimension: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            Icon(
              error ? Icons.info_outline : Icons.check_circle_outline,
              size: 20,
              color: error ? danger : blue,
            ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: TextStyle(color: error ? danger : ink)),
          ),
        ],
      ),
    ),
  );
}

class Verdict extends StatelessWidget {
  const Verdict({super.key, required this.text, required this.code});
  final String text;
  final Object? code;

  @override
  Widget build(BuildContext context) {
    final color = switch (code) {
      'sustentada' => success,
      'contradita' => danger,
      'mista' => warning,
      _ => muted,
    };
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class EvidenceOrbit extends StatelessWidget {
  const EvidenceOrbit({super.key});

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: SizedBox.square(
      dimension: 142,
      child: CustomPaint(
        painter: _OrbitLines(),
        child: Center(
          child: DecoratedBox(
            decoration: const BoxDecoration(
              color: navy,
              shape: BoxShape.circle,
            ),
            child: Image.asset('assets/symbol.webp', width: 76, height: 76),
          ),
        ),
      ),
    ),
  );
}

class _OrbitLines extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final stroke = Paint()
      ..color = const Color(0xFFC4DDE9)
      ..style = PaintingStyle.stroke;
    for (final radius in [48.0, 57.0, 67.0]) {
      canvas.drawCircle(center, radius, stroke);
    }
    canvas.drawLine(
      Offset(0, center.dy),
      Offset(size.width, center.dy),
      stroke,
    );
    canvas.drawLine(
      Offset(center.dx, 0),
      Offset(center.dx, size.height),
      stroke,
    );
    canvas.drawCircle(
      Offset(center.dx + 40, center.dy - 40),
      3.5,
      Paint()..color = cyan,
    );
  }

  @override
  bool shouldRepaint(covariant _OrbitLines oldDelegate) => false;
}
