from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Project, Partner, Supplier, Phase, SupplierPayment, PartnerPayment
from decimal import Decimal

class SettlementAPITestCase(APITestCase):
    def setUp(self):
        """Set up the test data."""
        # Create a project
        self.project = Project.objects.create(
            name="Test Project",
            start_date="2025-01-01",
            end_date="2025-12-31"
        )

        # Create partners with 60/40 split
        self.partner_a = Partner.objects.create(project=self.project, name="Partner A", percentage=Decimal("60.00"))
        self.partner_b = Partner.objects.create(project=self.project, name="Partner B", percentage=Decimal("40.00"))

        # Create a supplier and a phase
        self.supplier = Supplier.objects.create(name="Test Supplier")
        self.phase = Phase.objects.create(project=self.project, name="Foundation", amount_required=100000)

        # Total project cost is 100,000 (paid to supplier)
        SupplierPayment.objects.create(
            project=self.project,
            supplier=self.supplier,
            phase=self.phase,
            amount=Decimal("100000.00"),
            payment_date="2025-02-01"
        )

        # Partner A should pay 60,000, but pays 70,000 (overpaid by 10,000)
        PartnerPayment.objects.create(
            project=self.project,
            partner=self.partner_a,
            amount=Decimal("70000.00"),
            payment_date="2025-01-15"
        )

        # Partner B should pay 40,000, but pays 30,000 (underpaid by 10,000)
        PartnerPayment.objects.create(
            project=self.project,
            partner=self.partner_b,
            amount=Decimal("30000.00"),
            payment_date="2025-01-16"
        )

    def test_settlement_calculation(self):
        """Test the settlement API endpoint for correct calculations."""
        # URL for the settlement endpoint
        url = reverse('project-settlement', kwargs={'pk': self.project.pk})

        # Make the API call
        response = self.client.get(url)

        # Assert the response is successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Assert there are results for both partners
        self.assertEqual(len(response.data), 2)

        # Get data for each partner from the response
        settlement_a = next(item for item in response.data if item["partner_name"] == "Partner A")
        settlement_b = next(item for item in response.data if item["partner_name"] == "Partner B")

        # --- Assertions for Partner A ---
        # Amount due = 100,000 * 60% = 60,000
        self.assertEqual(Decimal(settlement_a['amount_due']), Decimal("60000.00"))
        # Total paid = 70,000
        self.assertEqual(Decimal(settlement_a['total_paid']), Decimal("70000.00"))
        # Settlement = 70,000 - 60,000 = +10,000
        self.assertEqual(Decimal(settlement_a['settlement_amount']), Decimal("10000.00"))

        # --- Assertions for Partner B ---
        # Amount due = 100,000 * 40% = 40,000
        self.assertEqual(Decimal(settlement_b['amount_due']), Decimal("40000.00"))
        # Total paid = 30,000
        self.assertEqual(Decimal(settlement_b['total_paid']), Decimal("30000.00"))
        # Settlement = 30,000 - 40,000 = -10,000
        self.assertEqual(Decimal(settlement_b['settlement_amount']), Decimal("-10000.00"))

    def test_project_treasury_balance(self):
        """Test the treasury balance property on the project model."""
        # Total income = 70,000 + 30,000 = 100,000
        # Total expense = 100,000
        # Balance = 100,000 - 100,000 = 0
        self.assertEqual(self.project.treasury_balance, Decimal("0.00"))

        # Make another payment from Partner A
        PartnerPayment.objects.create(
            project=self.project,
            partner=self.partner_a,
            amount=Decimal("5000.00"),
            payment_date="2025-03-01"
        )

        # Balance should now be 5,000
        self.assertEqual(self.project.treasury_balance, Decimal("5000.00"))
