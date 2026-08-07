from backend.app.comparison.change_analyzer import (
    DetailedChangeType,
    RequirementChangeAnalyzer,
)


def get_change_types(old_text: str, new_text: str) -> set[str]:
    analyzer = RequirementChangeAnalyzer()

    return {
        change.change_type.value
        for change in analyzer.analyze(
            old_text,
            new_text,
        )
    }


def test_numeric_change_is_detected() -> None:
    result = get_change_types(
        "Port kontrolü en fazla 3 kez yapılmalıdır.",
        "Port kontrolü en fazla 5 kez yapılmalıdır.",
    )

    assert "numeric_change" in result


def test_duration_change_is_detected() -> None:
    result = get_change_types(
        "İşlem 15 dakika içinde tamamlanmalıdır.",
        "İşlem 30 dakika içinde tamamlanmalıdır.",
    )

    assert "duration_change" in result

    # Sürenin içindeki sayı ayrıca numeric_change
    # olarak raporlanmamalıdır.
    assert "numeric_change" not in result


def test_modality_change_is_detected() -> None:
    result = get_change_types(
        "Müşteriye SMS gönderilmelidir.",
        "Müşteriye SMS gönderilebilir.",
    )

    assert "modality_change" in result


def test_negation_change_is_detected() -> None:
    result = get_change_types(
        "Sipariş iptal edilmelidir.",
        "Sipariş iptal edilmemelidir.",
    )

    assert "negation_change" in result


def test_condition_change_is_detected() -> None:
    result = get_change_types(
        "Müşteriye SMS gönderilmelidir.",
        (
            "Müşteri aktif ise müşteriye "
            "SMS gönderilmelidir."
        ),
    )

    assert "condition_change" in result


def test_scope_change_is_detected() -> None:
    result = get_change_types(
        "Tüm müşterilere bildirim gönderilmelidir.",
        (
            "Yalnızca kurumsal müşterilere "
            "bildirim gönderilmelidir."
        ),
    )

    assert "scope_change" in result


def test_actor_change_is_detected() -> None:
    result = get_change_types(
        "Müşteri siparişi iptal edebilir.",
        "Operatör siparişi iptal edebilir.",
    )

    assert "actor_change" in result


def test_state_change_is_detected() -> None:
    result = get_change_types(
        (
            "Aktif müşteriler sipariş "
            "oluşturabilir."
        ),
        (
            "Pasif müşteriler sipariş "
            "oluşturabilir."
        ),
    )

    assert "state_change" in result


def test_same_requirement_has_no_detailed_change() -> None:
    analyzer = RequirementChangeAnalyzer()

    result = analyzer.analyze(
        "Port kontrolü 3 kez yapılmalıdır.",
        "Port kontrolü 3 kez yapılmalıdır.",
    )

    assert result == []


def test_multiple_changes_can_be_detected() -> None:
    result = get_change_types(
        "Port kontrolü 3 kez yapılmalıdır.",
        "Port kontrolü 5 kez yapılabilir.",
    )

    assert "numeric_change" in result
    assert "modality_change" in result