# AWS Cloud Practitioner question bank validation

- DOCX entries extracted and retained: 306
- Structurally valid: 305
- Single choice: 261
- Multiple response: 45
- Entries requiring review: 22 (22 with technical flags)
- Structurally eligible after known review exclusions: 284
- Independently technically verified: 0
- Entries with AWS references: 123

Structural checks validate the extraction and the recorded key. They do not establish that the key is correct under current AWS guidance. Flagged source keys remain intact and are excluded from scoring. Future mock selection should also avoid choosing multiple entries from the same duplicate group.

## Domains

| CLF-C02 domain | Weight | Entries | Eligible | Mock target |
| --- | ---: | ---: | ---: | ---: |
| Cloud Concepts | 24% | 31 | 31 | 16 |
| Security and Compliance | 30% | 63 | 61 | 20 |
| Cloud Technology and Services | 34% | 174 | 162 | 22 |
| Billing, Pricing, and Support | 12% | 38 | 30 | 7 |

Domain titles and weights follow the [AWS CLF-C02 exam guide](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/).

## Structural findings

- Missing source numbers: Q5, Q86, Q238
- Repeated source numbers: Q105, Q251
- Missing prompt: 0
- Missing answer choices: 0
- Repeated option labels: 0
- Missing answer key: 1 (Q41 (ccp-0040))
- Invalid answer references: 0
- Ambiguous answer key: 0
- Answer count conflicts: 0
- Missing general explanations: 2 (Q3 (ccp-0003), Q303 (ccp-0302))

## Duplicate content

Exact groups match normalized question text. Potential duplicates have identical normalized option sets and either a matching final prompt line or at least 88% prompt similarity.

- Exact: Q250 (ccp-0248), Q251 (ccp-0250), Q257 (ccp-0256)
- Exact: Q251 (ccp-0249), Q252 (ccp-0251), Q258 (ccp-0257)
- Exact: Q253 (ccp-0252), Q259 (ccp-0258)
- Exact: Q254 (ccp-0253), Q260 (ccp-0259)
- Exact: Q255 (ccp-0254), Q261 (ccp-0260)
- Exact: Q256 (ccp-0255), Q262 (ccp-0261)
- Potential: Q138 (ccp-0137), Q160 (ccp-0159)

## Technical review

- Q2 (ccp-0002) — The source describes conditions and priority as part of the ALB default rule. AWS handles these separately. [AWS reference](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-rules.html)
- Q6 (ccp-0005) — Review legacy graphical tooling terminology against AWS Infrastructure Composer. [AWS reference](https://docs.aws.amazon.com/infrastructure-composer/latest/dg/what-is-composer.html)
- Q41 (ccp-0040) — The explanation appears to conflate Aurora reader and storage replication. The source has no explicit key. [AWS reference](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Replication.html)
- Q55 (ccp-0054) — This uses legacy launch configurations, subject to current restrictions for accounts and instance types. [AWS reference](https://docs.aws.amazon.com/autoscaling/ec2/userguide/launch-configurations.html)
- Q67 (ccp-0066) — The source key selects the fifth address. The source explanation and AWS IPv4 subnet documentation identify the fourth address instead. [AWS reference](https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html)
- Q120 (ccp-0119) — Check whether Organizations meets the stated analysis and visualization requirement alongside Cost Explorer. [AWS reference](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)
- Q127 (ccp-0126) — The source selects self-hosted MongoDB, which conflicts with the fully managed requirement.
- Q139 (ccp-0138) — The public-subnet requirement depends on the load balancer scheme. Check whether the prompt specifies an internet-facing ALB. [AWS reference](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html)
- Q155 (ccp-0154) — Review the explanation against current public IPv4 pricing for in-use and idle Elastic IP addresses. [AWS reference](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html)
- Q190 (ccp-0189) — The prompt says receive IPv6 internet access. The keyed gateway permits outbound initiation and response traffic. [AWS reference](https://docs.aws.amazon.com/vpc/latest/userguide/egress-only-internet-gateway.html)
- Q237 (ccp-0236) — The source describes conditions and priority as part of the ALB default rule. AWS handles these separately. [AWS reference](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-rules.html)
- Q239 (ccp-0237) — The public-subnet requirement depends on the load balancer scheme. Check whether the prompt specifies an internet-facing ALB. [AWS reference](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html)
- Q251 (ccp-0249) — The question uses legacy AWS Support plans and benefits. Check the region and plan transition before scoring it. [AWS reference](https://docs.aws.amazon.com/awssupport/latest/user/support-plans-eos.html)
- Q252 (ccp-0251) — The question uses legacy AWS Support plans and benefits. Check the region and plan transition before scoring it. [AWS reference](https://docs.aws.amazon.com/awssupport/latest/user/support-plans-eos.html)
- Q253 (ccp-0252) — The source uses the legacy AWS Simple Monthly Calculator. AWS currently directs estimates to AWS Pricing Calculator. [AWS reference](https://calculator.aws/)
- Q258 (ccp-0257) — The question uses legacy AWS Support plans and benefits. Check the region and plan transition before scoring it. [AWS reference](https://docs.aws.amazon.com/awssupport/latest/user/support-plans-eos.html)
- Q259 (ccp-0258) — The source uses the legacy AWS Simple Monthly Calculator. AWS currently directs estimates to AWS Pricing Calculator. [AWS reference](https://calculator.aws/)
- Q266 (ccp-0265) — The question uses legacy AWS Support plans and benefits. Check the region and plan transition before scoring it. [AWS reference](https://docs.aws.amazon.com/awssupport/latest/user/support-plans-eos.html)
- Q278 (ccp-0277) — The prompt asks for subnet-level restrictions. The source key uses security groups, which operate at the resource level. [AWS reference](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)
- Q294 (ccp-0293) — The blanket prior-approval requirement conflicts with current AWS policy for permitted services. [AWS reference](https://aws.amazon.com/security/penetration-testing/)
- Q298 (ccp-0297) — The question uses legacy AWS Support plans and benefits. Check the region and plan transition before scoring it. [AWS reference](https://docs.aws.amazon.com/awssupport/latest/user/support-plans-eos.html)
- Q301 (ccp-0300) — Review current AWS OpsWorks availability before scoring the question. [AWS reference](https://docs.aws.amazon.com/opsworks/latest/userguide/welcome.html)

## Preliminary CSV reconciliation

The CSV contains 306 rows. The classification manifest records a prompt-based review against the AWS exam guide. The CSV was used only for comparison.

- Different domain assignments in matched rows: 86
- Question numbers or previews requiring CSV alignment review: None
