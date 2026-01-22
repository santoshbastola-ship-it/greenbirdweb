enum PaymentStatus {
  Pending,
  PaidCash,
  PaidOnline,
  PartialCash,
  PartialOnline;
  
  String get displayName {
    switch (this) {
      case PaymentStatus.Pending: return 'Pending';
      case PaymentStatus.PaidCash: return 'Paid - Cash';
      case PaymentStatus.PaidOnline: return 'Paid - Online';
      case PaymentStatus.PartialCash: return 'Partially Paid - Cash';
      case PaymentStatus.PartialOnline: return 'Partially Paid - Online';
    }
  }
  
  bool get isPaid => this == PaymentStatus.PaidCash || this == PaymentStatus.PaidOnline;
  bool get isPartial => this == PaymentStatus.PartialCash || this == PaymentStatus.PartialOnline;
  bool get isPending => this == PaymentStatus.Pending;
}
